# Code Review: Product Attributes & Options

**Reviewer:** Senior Developer / Solution Architect  
**Scope:** `packages/modules/b2c-core` — product attributes, attribute values, product options, attribute↔option conversion  
**Date:** 2026-02-11

---

## Spis treści

1. [Architektura — podsumowanie](#1-architektura--podsumowanie)
2. [Krytyczne błędy logiczne](#2-krytyczne-błędy-logiczne)
3. [Problemy wydajnościowe](#3-problemy-wydajnościowe)
4. [Luki w walidacji](#4-luki-w-walidacji)
5. [Problemy ze spójnością danych](#5-problemy-ze-spójnością-danych)
6. [Pokrycie User Stories](#6-pokrycie-user-stories)
7. [Problemy architektoniczne i jakość kodu](#7-problemy-architektoniczne-i-jakość-kodu)
8. [Podsumowanie priorytetów](#8-podsumowanie-priorytetów)

---

## 1. Architektura — podsumowanie

System operuje na dwóch równoległych modelach:

| Koncept                                    | Tabela                         | Rola                                               |
| ------------------------------------------ | ------------------------------ | -------------------------------------------------- |
| **Attribute** + **AttributeValue**         | `attribute`, `attribute_value` | Atrybuty informacyjne (filtrowanie, opis produktu) |
| **ProductOption** + **ProductOptionValue** | Medusa core                    | Opcje wariantowe (generują warianty)               |

Konwersja między tymi modelami odbywa się przez flagi `use_for_variations` (attribute → option) i `convert_to_attribute` (option → attribute).

Relacje linkowe:

- `product ↔ attribute_value` — przypisanie wartości atrybutu do produktu
- `seller ↔ attribute` — własność definicji atrybutu vendora
- `seller ↔ attribute_value` — własność wartości atrybutu vendora
- `category ↔ attribute` — przypisanie atrybutu do kategorii

---

## 2. Krytyczne błędy logiczne

### 2.1 🔴 N+1 sequential DB calls w pętlach `for...of` (route handlers)

**Status:** `Completed`

**Pliki:**

- `api/vendor/products/[id]/attributes/route.ts` (linie 128-167, 180-199)
- `api/vendor/products/[id]/attributes/[attribute_id]/route.ts` (linie 210-265)
- `api/vendor/products/[id]/options/[option_id]/route.ts` (linie 212-231)
- `workflows/attribute/utils/vendor-attribute-creation.ts` (linie 37-56)

**Problem:** Każda wartość atrybutu jest tworzona sekwencyjnie w pętli `for...of`, a następnie dla każdej wartości tworzony jest link do produktu (osobne zapytanie) i ewentualnie link do sellera (kolejne zapytanie). Dla atrybutu z 10 wartościami to **30 sekwencyjnych zapytań do bazy** zamiast 3 operacji batch.

**Przykład z `attributes/route.ts` POST:**

```typescript
// PROBLEM: 3 zapytania na każdą wartość, sekwencyjnie
for (const value of values) {
  const attributeValue = await attributeService.createAttributeValues({...});
  await linkService.create({...}); // link do produktu
  await linkService.create({...}); // link do sellera
}
```

**Proponowane rozwiązanie:**

```typescript
// Batch: stwórz wszystkie wartości naraz
const attributeValues = await Promise.all(
  values.map((value) =>
    attributeService.createAttributeValues({
      value,
      attribute_id: resolvedAttributeId,
      source: valueSource,
      rank: 0
    })
  )
);

// Batch: stwórz wszystkie linki naraz
const productLinks = attributeValues.map((av) => ({
  [Modules.PRODUCT]: { product_id },
  [ATTRIBUTE_MODULE]: { attribute_value_id: av.id }
}));
await linkService.create(productLinks);

if (valueSource === AttributeSource.VENDOR) {
  const sellerLinks = attributeValues.map((av) => ({
    [SELLER_MODULE]: { seller_id: seller.id },
    [ATTRIBUTE_MODULE]: { attribute_value_id: av.id }
  }));
  await linkService.create(sellerLinks);
}
```

### 2.2 🔴 Brak transakcyjności w operacjach multi-step

**Status:** `Completed`

**Pliki:**

- `api/vendor/products/[id]/attributes/route.ts` — POST handler
- `api/vendor/products/[id]/attributes/[attribute_id]/route.ts` — POST handler (update)
- `api/vendor/products/[id]/options/[option_id]/route.ts` — POST handler (convert_to_attribute)

**Problem:** Operacje takie jak "konwersja atrybutu na opcję" (`use_for_variations=true` w update) wykonują wiele kroków:

1. Tworzenie ProductOption
2. Usuwanie linków attribute_value → product
3. Usuwanie attribute_value

Jeśli krok 2 lub 3 się nie powiedzie, w bazie zostanie ProductOption **i** AttributeValues — duplikacja danych. Te operacje nie są opakowane w żaden workflow z compensation steps ani w transakcję bazodanową.

**Proponowane rozwiązanie:** Przenieść logikę konwersji do dedykowanego workflow (`convertAttributeToOptionWorkflow`) z krokami kompensacyjnymi. Analogicznie dla `convert_to_attribute`.

### 2.3 🔴 Brak walidacji duplikatów atrybutów na produkcie

**Status:** `Completed`

**Plik:** `api/vendor/products/[id]/attributes/route.ts` — POST handler

**Problem:** Endpoint pozwala na wielokrotne dodanie tego samego atrybutu do produktu. Nie ma sprawdzenia czy produkt już posiada wartości dla danego `attribute_id`. Prowadzi to do duplikowania danych.

**Proponowane rozwiązanie:**

```typescript
// Przed tworzeniem wartości, sprawdź czy atrybut już jest na produkcie
const existingValues = await getProductAttributeValues(
  req.scope,
  product_id,
  resolvedAttributeId
);

if (existingValues.length > 0) {
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    `Attribute already assigned to this product. Use UPDATE endpoint to modify values.`
  );
}
```

### 2.4 ℹ️ `use_for_variations=true` w POST attributes nie tworzy AttributeValues — by design

**Status:** `N/A`

**Plik:** `api/vendor/products/[id]/attributes/route.ts` (linie 86-100)

**Zachowanie:** Gdy vendor dodaje atrybut z `use_for_variations=true`, tworzony jest tylko ProductOption — bez AttributeValues. Jest to **celowe**, ponieważ tylko atrybuty zdefiniowane przez admina są filtrowalne. Vendor-sourced atrybuty nie trafiają do filtrów (Algolia), więc nie ma potrzeby duplikowania danych w AttributeValues.

Porównaj z `products-created-handler.ts` linia 91-114, gdzie dla **admin** atrybutów z `use_for_variations=true` tworzone są oba — ProductOption i AttributeValues — bo admin atrybuty służą do filtrowania.

**Uwaga:** Warto dodać komentarz w kodzie wyjaśniający to rozróżnienie, bo brak tworzenia AttributeValues wygląda jak przeoczenie bez kontekstu biznesowego.

### 2.5 🟡 DELETE atrybutu admina — niespójne zachowanie

**Status:** `Completed`

**Plik:** `api/vendor/products/[id]/attributes/[attribute_id]/route.ts` — DELETE handler (linie 391-400)

**Problem:** Dla admin atrybutów, DELETE usuwa tylko wartości vendor-sourced (`av.source === AttributeSource.VENDOR`). Ale co jeśli wszystkie wartości są admin-sourced (vendor wybrał wartości z possible_values)? W tym przypadku `valuesToRemove` będzie puste — nic nie zostanie usunięte, ale endpoint zwróci `deleted: true`.

**Proponowane rozwiązanie:** Dla admin atrybutów non-required, usuwaj **wszystkie** wartości powiązane z produktem (niezależnie od source). Vendor "odłącza" atrybut od produktu, nie definiuje go.

---

## 3. Problemy wydajnościowe

### 3.1 🔴 `findOrCreateVendorAttribute` — full scan linków sellera

**Status:** `Completed`

**Plik:** `workflows/attribute/utils/find-or-create-vendor-attribute.ts` (linie 49-68)

**Problem:** Funkcja pobiera **wszystkie** linki seller → attribute dla danego sellera, a następnie w pamięci szuka atrybutu po nazwie. Jeśli vendor ma 100+ atrybutów, to niepotrzebnie pobieramy je wszystkie.

```typescript
// Pobiera WSZYSTKIE atrybuty sellera, potem filtruje w JS
const { data: existingLinks } = await query.graph({
  entity: sellerAttributeLink.entryPoint,
  fields: [
    'attribute.id',
    'attribute.name',
    'attribute.source',
    'attribute.ui_component'
  ],
  filters: {
    seller_id: input.sellerId
  }
});

const existingAttribute = existingLinks
  .map((link) => link.attribute)
  .find(
    (attr) =>
      attr.source === AttributeSource.VENDOR &&
      attr.name.toLowerCase() === searchableName
  );
```

**Proponowane rozwiązanie:** Użyj bezpośredniego filtra na poziomie zapytania:

```typescript
// Jeden precyzyjny query zamiast full scan
const { data: existingAttributes } = await query.graph({
  entity: 'attribute',
  fields: ['id', 'name'],
  filters: {
    source: AttributeSource.VENDOR,
    handle: generateVendorAttributeHandle(input.sellerId, input.name)
  }
});
```

Handle jest generowany deterministycznie z `sellerId` + `name`, więc jest unikalny i indeksowany.

### 3.2 🔴 `getApplicableAttributes` — 4 zapytania zamiast 1-2

**Status:** `Completed`

**Plik:** `shared/infra/http/utils/products.ts` (linie 68-120)

**Problem:** Funkcja wykonuje 4 osobne zapytania:

1. Pobierz kategorie produktu
2. Pobierz **wszystkie** category-attribute linki (bez filtra!)
3. Pobierz atrybuty globalne ($nin)
4. Pobierz atrybuty kategorii

Krok 2 pobiera **absolutnie wszystkie** linki category-attribute w systemie, żeby wyliczyć listę atrybutów przypisanych do jakiejkolwiek kategorii. Przy 1000 kategorii z 50 atrybutami każda to 50,000 rekordów.

```typescript
// BEZ filtra — pobiera WSZYSTKIE linki category-attribute w systemie
const { data: attributes } = await query.graph({
  entity: categoryAttribute.entryPoint,
  fields: ['attribute_id']
});
```

Ten sam problem występuje w `api/vendor/products/[id]/applicable-attributes/route.ts` (linie 93-97).

**Proponowane rozwiązanie:**

```typescript
export async function getApplicableAttributes(
  container: MedusaContainer,
  product_id: string,
  fields: string[]
): Promise<AttributeDTO[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // 1. Pobierz kategorie produktu
  const {
    data: [product]
  } = await query.graph({
    entity: 'product',
    fields: ['categories.id'],
    filters: { id: product_id }
  });
  const categoryIds = product.categories.map((c) => c.id);

  // 2. Pobierz atrybuty kategorii TYLKO dla kategorii tego produktu
  const { data: categoryAttributes } = await query.graph({
    entity: categoryAttribute.entryPoint,
    fields: ['attribute_id', ...fields.map((f) => `attribute.${f}`)],
    filters: {
      product_category_id: categoryIds
    }
  });
  const categoryAttributeIds = new Set(
    categoryAttributes.map((a) => a.attribute_id)
  );

  // 3. Pobierz atrybuty globalne (te, które NIE są przypisane do żadnej kategorii)
  //    Użyj subquery lub LEFT JOIN zamiast pobrania wszystkich linków
  const { data: globalAttributes } = await query.graph({
    entity: 'attribute',
    fields,
    filters: {
      source: 'admin',
      // Atrybuty, które nie mają żadnego powiązania z kategorią
      id: { $nin: [...categoryAttributeIds] }
    }
  });

  return [
    ...globalAttributes,
    ...categoryAttributes.map((rel) => rel.attribute)
  ];
}
```

**Uwaga:** Powyższe rozwiązanie nadal nie jest idealne, bo `$nin` z attribute IDs powiązanych z kategoriami produktu != "atrybuty bez powiązania z jakąkolwiek kategorią". Potrzebujesz dwóch osobnych konceptów: atrybuty globalne (bez żadnego powiązania z kategorią) i atrybuty kategoriowe (powiązane z kategorią produktu). Obecna logika jest **poprawna koncepcyjnie** ale nieefektywna implementacyjnie.

### 3.3 🟡 Sekwencyjne dismiss/delete w pętli (update + delete handlers)

**Status:** `Completed`

**Plik:** `api/vendor/products/[id]/attributes/[attribute_id]/route.ts` (linie 155-163, 210-216)

**Problem:** Zarówno w konwersji na opcję jak i w usuwaniu starych wartości, dismiss i delete są wykonywane sekwencyjnie w pętli:

```typescript
for (const valueId of valueIds) {
  await linkService.dismiss({...});
}
await attributeService.deleteAttributeValues(valueIds);
```

**Proponowane rozwiązanie:** `linkService.dismiss` powinien przyjmować tablicę:

```typescript
await linkService.dismiss(
  valueIds.map((valueId) => ({
    [Modules.PRODUCT]: { product_id },
    [ATTRIBUTE_MODULE]: { attribute_value_id: valueId }
  }))
);
await attributeService.deleteAttributeValues(valueIds);
```

### 3.4 🟡 `updateProductOptionsMetadata` — raw SQL z `Promise.all`

**Status:** `Completed`

**Plik:** `shared/infra/http/utils/products.ts` (linie 23-57)

**Problem:** Każda opcja jest aktualizowana osobnym raw SQL UPDATE. Przy wielu opcjach to wiele roundtripów.

**Proponowane rozwiązanie:** Użyj jednego batch UPDATE:

```sql
UPDATE product_option
SET metadata = CASE
  WHEN id = ? THEN ?::jsonb
  WHEN id = ? THEN ?::jsonb
END
WHERE id IN (?, ?)
```

---

## 4. Luki w walidacji

### 4.1 🔴 Brak walidacji przynależności atrybutu do kategorii produktu (POST attributes)

**Status:** `Completed`

**Plik:** `api/vendor/products/[id]/attributes/route.ts`

**Problem:** Gdy vendor dodaje admin atrybut (`attribute_id` provided), nie ma sprawdzenia czy ten atrybut jest "applicable" do produktu (czy jest globalny lub przypisany do kategorii produktu). Vendor może przypisać **dowolny** admin atrybut do produktu, nawet taki który nie powinien być dostępny.

Porównaj: `products-created-handler.ts` (linia 94) — tam jest `ensureApplicableAttribute`. Ale w POST `/products/:id/attributes` — nie ma.

**Proponowane rozwiązanie:** Dodaj walidację applicability:

```typescript
if (attribute_id) {
  const applicableAttributes = await getApplicableAttributes(
    req.scope,
    product_id,
    ['id']
  );
  const applicableIds = new Set(applicableAttributes.map((a) => a.id));

  if (!applicableIds.has(attribute_id)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Attribute is not applicable to this product's category`
    );
  }
}
```

### 4.2 🔴 Vendor nie może rozszerzać admin atrybutów o własne wartości (blokujący throw)

**Status:** `Completed`

**Pliki:**

- `api/vendor/products/[id]/attributes/route.ts` (linie 128-144)
- `api/vendor/products/[id]/attributes/[attribute_id]/route.ts` (linie 230-238)
- `workflows/attribute/utils/attribute-value-creation.ts` (linie 22-29)

**Kontekst biznesowy:** Non-required admin atrybuty są "podpowiadane" vendorowi. Vendor może wybrać wartości z `possible_values`, ale **powinien móc je również rozszerzyć** o własne wartości (source: `vendor`). Te vendor-extensions nie będą filtrowalne (bo source != admin), ale będą widoczne jako informacyjne.

**Problem:** We wszystkich trzech lokalizacjach kod zawiera `throw`, który blokuje wartości spoza `possible_values`:

```typescript
// Logika source determination jest poprawna...
const isFromPossibleValues =
  allowedValues.size === 0 || allowedValues.has(value);

// ...ale ten throw nigdy nie pozwoli dotrzeć do gałęzi VENDOR
if (allowedValues.size > 0 && !allowedValues.has(value)) {
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    `Value "${value}" is not allowed for attribute...`
  );
}

// Dead code — valueSource nigdy nie będzie VENDOR
valueSource = isFromPossibleValues
  ? AttributeSource.ADMIN
  : AttributeSource.VENDOR;
```

Kod wyraźnie został **zaprojektowany** z myślą o vendor extensions (logika `isFromPossibleValues` → source determination → seller link), ale `throw` blokuje ten flow.

**Proponowane rozwiązanie:** Usunąć `throw` i pozwolić na vendor extensions:

```typescript
for (const value of values) {
  const isFromPossibleValues =
    allowedValues.size === 0 || allowedValues.has(value);

  // Nie blokuj — pozwól na vendor extension
  const valueSource = isFromPossibleValues
    ? AttributeSource.ADMIN
    : AttributeSource.VENDOR;

  const attributeValue = await attributeService.createAttributeValues({
    value,
    attribute_id: resolvedAttributeId,
    source: valueSource,
    rank: 0
  });

  await linkService.create({
    [Modules.PRODUCT]: { product_id },
    [ATTRIBUTE_MODULE]: { attribute_value_id: attributeValue.id }
  });

  // Vendor extensions → link do sellera dla ownership tracking
  if (valueSource === AttributeSource.VENDOR) {
    await linkService.create({
      [SELLER_MODULE]: { seller_id: seller.id },
      [ATTRIBUTE_MODULE]: { attribute_value_id: attributeValue.id }
    });
  }
}
```

**Dotyczy 3 plików** — naprawka musi być spójna we wszystkich.

### 4.3 🟡 Brak walidacji, czy vendor edytuje wartość atrybutu innego vendora

**Status:** `Completed`

**Plik:** `api/vendor/products/[id]/attributes/[attribute_id]/route.ts` — POST (update)

**Problem:** Przy aktualizacji admin atrybutu (source = admin), vendor może usunąć wartości dodane przez innego vendora (jeśli jakoś dzielą produkt). Nie ma filtra `seller_id` na `toRemove`. Jednakże, dziś produkty są per-seller, więc to edge case. Warto mieć na uwadze na przyszłość.

### 4.4 🟡 Brak walidacji `values.min(1)` w `VendorUpdateProductAttribute`

**Status:** `Completed`

**Plik:** `api/vendor/products/validators.ts` (linia 956)

**Problem:** `values` jest opcjonalne, ale gdy podane, nie wymaga minimum 1 elementu (`z.array(z.string()).min(1).optional()`). Vendor może wysłać pusty array `values: []`, co efektywnie usunie wszystkie wartości atrybutu bez korzystania z DELETE endpointu.

Poprawka: Zmień `z.array(z.string()).min(1).optional()` — `min(1)` jest obecne, ale to dobrze. Natomiast `values: []` przejdzie walidację jako falsy (`[].length === 0` jest falsy w `.min(1)`) — **aktualizacja: .min(1) jest poprawne**, ten punkt wycofuję.

### 4.5 🔴 Brak weryfikacji przynależności produktu do sellera w atrybutowych route'ach

**Status:** `Completed`

**Pliki:** `api/vendor/products/[id]/attributes/route.ts`, `api/vendor/products/[id]/attributes/[attribute_id]/route.ts`

**Problem:** Middleware `checkResourceOwnershipByResourceId` jest poprawnie zastosowany (widoczne w `middlewares.ts` linie 281-317). Ale sam handler dla DELETE atrybutu (`[attribute_id]/route.ts`) **nie sprawdza** czy product jest powiązany z atrybutem. Vendor może podać `product_id` produktu który posiada, ale `attribute_id` atrybutu który nie jest powiązany z tym produktem. W efekcie `getProductAttributeValues` zwróci 0 wyników, i operacja po prostu nic nie zrobi (silent no-op).

Nie jest to security issue, ale jest to UX issue — powinien być zwracany 404 jeśli atrybut nie jest powiązany z produktem.

---

## 5. Problemy ze spójnością danych

### 5.1 🔴 Konwersja option → attribute nie sprawdza istniejących wariantów

:exclamation::exclamation::exclamation: **Notatka Developera:**
Konwersja z opcji na atrybut nie sprawdza istniejących wariantów ponieważ sama Medusa działa w podobny sposób. Mianowicie user ma mozliwość usnięcie opcji przy czym varianty stracą swoję powiązanie do tej opcji. Usunięcie variantów musi nastąpić manualnie.

**Status:** `Won't Do`

**Plik:** `api/vendor/products/[id]/options/[option_id]/route.ts` (linie 167-237)

**Problem:** Konwersja opcji na atrybut (`convert_to_attribute=true`) usuwa ProductOption, co **usuwa option values z wariantów**. Jeśli produkt ma warianty, te warianty stracą swoje wartości opcji. Nie ma walidacji, czy istnieją warianty korzystające z tej opcji.

**Proponowane rozwiązanie:**

```typescript
if (convert_to_attribute) {
  // Sprawdź czy istnieją warianty korzystające z tej opcji
  const { data: variants } = await query.graph({
    entity: 'product_variant',
    fields: ['id', 'options.option_id'],
    filters: { product_id: productId }
  });

  const variantsUsingOption = variants.filter((v) =>
    v.options?.some((o) => o.option_id === optionId)
  );

  if (variantsUsingOption.length > 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Cannot convert option to attribute: ${variantsUsingOption.length} variants use this option. Remove variants first.`
    );
  }
}
```

### 5.2 🔴 Konwersja attribute → option nie usuwa seller-value linków

**Status:** `Completed`

**Plik:** `api/vendor/products/[id]/attributes/[attribute_id]/route.ts` (linie 130-163)

**Problem:** Przy `use_for_variations=true`, attribute values są usuwane (dismiss product-link + delete values), ale **link seller ↔ attribute_value nie jest usuwany**. Te osierocone linki zostają w bazie.

```typescript
// BRAK:
// await linkService.dismiss({
//   [SELLER_MODULE]: { seller_id: seller.id },
//   [ATTRIBUTE_MODULE]: { attribute_value_id: valueId },
// });
```

### 5.3 🟡 `rank: 0` — hardcoded dla wszystkich wartości

**Status:** `Planned`

**Pliki:** Wszystkie miejsca tworzące AttributeValues

**Problem:** Wszystkie nowo tworzone `attribute_value` mają `rank: 0`. Kolejność wartości nie jest zachowana. Jeśli vendor poda `values: ["S", "M", "L", "XL"]`, wszystkie będą miały `rank: 0` i kolejność wyświetlania będzie nieokreślona.

**Proponowane rozwiązanie:**

```typescript
values.map((value, index) => ({
  value,
  attribute_id: resolvedAttributeId,
  source: valueSource,
  rank: index
}));
```

### 5.4 🟡 Brak cascade cleanup przy usuwaniu AttributeValue

**Status:** `Planned`

**Problem:** Gdy `attributeService.deleteAttributeValues(valueId)` jest wywoływany, linki `seller ↔ attribute_value` nie są automatycznie czyszczone. Model `attribute_value` nie ma zdefiniowanej kaskady na linki (bo linki są zewnętrzne — Medusa remote links). Trzeba ręcznie czyścić oba linki.

To dotyczy również `delete-attribute-value` workflow — `dismissRemoteLinkStep` w `deleteAttributeValueWorkflow` czyści tylko link `product ↔ attribute_value`, ale **nie** `seller ↔ attribute_value`.

### 5.5 🟡 `transformProductWithInformationalAttributes` — filtrowanie po nazwie (case-insensitive) jest kruche

**Status:** `Planned`

**Plik:** `api/vendor/products/utils/transform-product-attributes.ts` (linie 127-134)

**Problem:** Atrybuty są filtrowane z odpowiedzi, jeśli ich nazwa (case-insensitive) pasuje do tytułu ProductOption. To porównanie po nazwie (string matching) zamiast po relacji/ID jest kruche — zmiana tytułu opcji bez zmiany nazwy atrybutu (lub odwrotnie) spowoduje niespójność w wyświetlaniu.

```typescript
const optionTitles = new Set(
  (product.options ?? []).map((option) => option.title.toLowerCase())
);

// Filtruje atrybuty, których nazwa pasuje do opcji
const filteredAttributeValues = (product.attribute_values ?? []).filter(
  (av) =>
    av && av.attribute && !optionTitles.has(av.attribute.name.toLowerCase())
);
```

**Proponowane rozwiązanie:** Użyj metadanych na ProductOption (np. `metadata.attribute_id`) do powiązania zamiast string matching po nazwie.

---

## 6. Pokrycie User Stories

### US1: View Product Attributes ✅

Obsłużone przez `transformProductWithInformationalAttributes` — admin atrybuty i vendor atrybuty wyświetlane razem, z flagami `attribute_source`, `is_definition_editable`, `is_editable`.

### US2: Add a New Attribute (Vendor) ✅

Obsłużone przez POST `/vendor/products/:id/attributes` z `name` (bez `attribute_id`).

### US3: Edit a Vendor Attribute ✅

Obsłużone przez POST `/vendor/products/:id/attributes/:attribute_id`.

### US4: Delete a Vendor Attribute ✅

Obsłużone przez DELETE `/vendor/products/:id/attributes/:attribute_id` — z walidacją `source === VENDOR`.

### US5: View and Edit Admin Attributes ⚠️ Częściowe

- Edycja wartości admin atrybutu działa poprawnie dla wartości z `possible_values`.
- **Problem 1 (krytyczny):** Vendor **nie może** rozszerzyć admin atrybutu o własne wartości — `throw` blokuje wartości spoza `possible_values` (punkt 4.2). Kod ma logikę source determination (`ADMIN` vs `VENDOR`), ale jest ona nieosiągalna.
- **Problem 2:** Nie ma zabezpieczenia, że vendor nie może usunąć admin-sourced wartości. W `DELETE` handler, dla admin atrybutów usuwane są tylko `VENDOR` sourced wartości — ale z samego API nie jest to jasne. Frontend musi znać tę logikę.

### US6: Enable "Use for variations" ⚠️ Problemy

- Toggle działa, ale konwersja nie jest atomowa (brak transakcji — punkt 2.2).
- Nie tworzy AttributeValues przy `use_for_variations=true` w POST (punkt 2.4).
- Brak czyszczenia seller-value linków (punkt 5.2).

### US7: Add New Values to Variation Attribute ⚠️ Brakuje

- Nie ma dedykowanego flow do dodawania wartości do atrybutu, który jest już w trybie "variation". Vendor musiałby zaktualizować opcję (nie atrybut), ale API opcji nie rozumie kontekstu "variation attribute".

### US8: Success Feedback ✅

- Obsłużone na poziomie odpowiedzi API (zwraca zaktualizowany produkt).
- **Problem:** POST `/vendor/products/:id/attributes` i POST/DELETE `/vendor/products/:id/attributes/:attribute_id` **nie emitują** `ProductUpdateRequestUpdatedEvent` dla opublikowanych produktów. Porównaj z POST `/vendor/products/:id/options` i POST `/vendor/products/:id/options/:option_id` — te emitują event. Oznacza to, że zmiany w atrybutach opublikowanego produktu nie wchodzą w approval flow.

---

## 7. Problemy architektoniczne i jakość kodu

### 7.1 🔴 Brak ProductUpdateRequest event w attribute route'ach

:exclamation::exclamation::exclamation: **Notatka Developera:**
Brak decyzji (wymagań) co do tego jak requesty mają wpływać na atrybuty produktów.

**Status:** `TBD`

**Pliki:**

- `api/vendor/products/[id]/attributes/route.ts` — POST
- `api/vendor/products/[id]/attributes/[attribute_id]/route.ts` — POST, DELETE

**Problem:** Endpointy opcji (`/options`) poprawnie emitują `ProductUpdateRequestUpdatedEvent.TO_CREATE` dla opublikowanych produktów. Endpointy atrybutów tego **nie robią**. Wg user stories (US8): _"Approval requirements apply for published products"_.

### 7.2 🟡 Logika biznesowa w route handlerach zamiast w workflowach

**Status:** `Planned`

**Problem:** Route handlery (`route.ts`) zawierają złożoną logikę biznesową:

- Tworzenie attribute values z linkami
- Konwersja attribute ↔ option
- Walidacja ownership
- Source determination

To powinno być w dedykowanych workflow'ach z compensation steps (rollback), co zapewni:

- Transakcyjność
- Reusability (ten sam workflow z hooka i z route'a)
- Testowalność

### 7.3 🟡 Duplikacja kodu — tworzenie attribute values + linków

**Status:** `Planned`

Pattern "create AttributeValue → create product link → create seller link" jest zduplikowany w:

1. `api/vendor/products/[id]/attributes/route.ts` POST (2x — admin i vendor path)
2. `api/vendor/products/[id]/attributes/[attribute_id]/route.ts` POST (update — add new values)
3. `api/vendor/products/[id]/options/[option_id]/route.ts` POST (convert_to_attribute)
4. `workflows/attribute/utils/vendor-attribute-creation.ts`

**Proponowane rozwiązanie:** Wyextrahuj do reużywalnej funkcji lub stepu workflow'owego:

```typescript
async function createAndLinkAttributeValues(params: {
  container: MedusaContainer;
  attributeId: string;
  values: string[];
  productId: string;
  sellerId?: string;
  source: AttributeSource;
}) { ... }
```

### 7.4 🟡 `VendorUpdateVendorProductAttribute` — deprecated ale nie usunięty

**Status:** `Planned`

**Plik:** `api/vendor/products/validators.ts` (linie 961-972)

```typescript
/**
 * @deprecated Use VendorUpdateProductAttribute instead
 */
export const VendorUpdateVendorProductAttribute = z.object({...});
```

Deprecated schema powinna zostać usunięta jeśli nie jest używana. Zweryfikuj, czy frontend nadal go używa.

### 7.5 🟡 `console.log` w produkcyjnym kodzie

**Status:** `Planned`

**Plik:** `workflows/hooks/product-created.ts` (linia 102)

```typescript
console.log(
  'existingSecondaryCategoriesMap',
  existingSecondaryCategoriesByCategoryIdMap
);
```

Debugowy log w produkcyjnym kodzie. Usuń.

### 7.6 🟡 Typ `any` w wielu miejscach

**Status:** `Planned`

- `route.ts`: `transformProductWithInformationalAttributes(product as any)`
- `getAttributeName`: `query: any`
- `[attribute_id]/route.ts`: `(info as any).id`

Powinny być typed.

### 7.7 🟡 `getApplicableAttributes` — duplikacja w route i utility

**Status:** `Completed`

**Pliki:**

- `api/vendor/products/[id]/applicable-attributes/route.ts` — inline logika
- `shared/infra/http/utils/products.ts` — funkcja `getApplicableAttributes`

Te dwa pliki zawierają identyczną logikę (4 query pattern), ale route nie korzysta z utility function. Powinien.

---

## 8. Podsumowanie priorytetów

### Krytyczne (P0) — naprawić przed release'em

| #   | Problem                                                      | Ryzyko                                                     | Status      |
| --- | ------------------------------------------------------------ | ---------------------------------------------------------- | ----------- |
| 2.1 | N+1 queries w pętlach                                        | Performance degradation — O(n) queries per attribute value | `Completed` |
| 2.2 | Brak transakcyjności w konwersjach                           | Data corruption przy partial failure                       | `Completed` |
| 2.3 | Brak walidacji duplikatów atrybutów                          | Duplicate data, UX confusion                               | `Completed` |
| 3.2 | `getApplicableAttributes` — full scan linków                 | O(total_links) zamiast O(category_links)                   | `Completed` |
| 5.1 | Konwersja option→attribute bez sprawdzenia wariantów         | Warianty tracą dane                                        | `Won't Do`  |
| 5.2 | Brak czyszczenia seller-value linków                         | Orphaned data                                              | `Completed` |
| 4.2 | Vendor nie może rozszerzać admin atrybutów o własne wartości | Blokuje kluczowy use case — throw w 3 plikach              | `Completed` |
| 7.1 | Brak approval flow event dla atrybutów                       | Business logic gap                                         | `TBD`       |

### Ważne (P1) — naprawić w kolejnym sprincie

| #   | Problem                                         | Ryzyko                                | Status      |
| --- | ----------------------------------------------- | ------------------------------------- | ----------- |
| 2.5 | DELETE admin atrybutu — silent no-op            | UX confusion                          | `Completed` |
| 3.1 | `findOrCreateVendorAttribute` full scan         | Slow for vendors with many attributes | `Completed` |
| 3.3 | Sequential dismiss/delete                       | Unnecessary latency                   | `Completed` |
| 4.1 | Brak walidacji applicability w POST             | Vendor przypisuje nieistotne atrybuty | `Completed` |
| 5.3 | `rank: 0` hardcoded                             | Randomowa kolejność wartości          | `Planned`   |
| 5.5 | String matching na nazwie (attribute vs option) | Fragile coupling                      | `Planned`   |
| 7.2 | Logika biznesowa w route handlerach             | Brak rollback, brak reusability       | `Completed` |
| 7.3 | Duplikacja kodu                                 | Maintenance burden                    | `Completed` |

### Nice-to-have (P2)

| #   | Problem                                            | Status      |
| --- | -------------------------------------------------- | ----------- |
| 3.4 | Batch SQL UPDATE dla metadata opcji                | `Completed` |
| 5.4 | Brak cascade cleanup linków seller-attribute_value | `Completed` |
| 7.4 | Deprecated schema nie usunięty                     | `Completed` |
| 7.5 | `console.log` w produkcji                          | `Planned`   |
| 7.6 | Użycie `any`                                       | `Planned`   |
| 7.7 | Duplikacja applicable-attributes logiki            | `Completed` |
