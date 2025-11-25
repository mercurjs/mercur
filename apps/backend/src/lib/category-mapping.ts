/**
 * Mapping: Product Type → Category Hierarchy
 * 
 * Structure: Product Type → [Category, Subcategory, Product Type Category]
 */

export const PRODUCT_TYPE_TO_CATEGORY: Record<string, {
  level1: string
  level2: string
  level3: string
}> = {
  // Building Materials → Timber
  'TREATED_SAWN': { level1: 'Building Materials', level2: 'Timber', level3: 'Treated Sawn' },
  'PLANED_SQUARE_EDGE': { level1: 'Building Materials', level2: 'Timber', level3: 'Planed Square Edge' },
  'TREATED_SAWN_C16': { level1: 'Building Materials', level2: 'Timber', level3: 'Treated Sawn C16' },
  'CLS_STUDWORK': { level1: 'Building Materials', level2: 'Timber', level3: 'CLS Studwork' },
  'CLADDING': { level1: 'Building Materials', level2: 'Timber', level3: 'Cladding' },

  // Building Materials → Sheet Materials
  'PLYWOOD_SHEETS': { level1: 'Building Materials', level2: 'Sheet Materials', level3: 'Plywood Sheets' },
  'MDF_SHEETS': { level1: 'Building Materials', level2: 'Sheet Materials', level3: 'MDF Sheets' },
  'OSB_SHEETS': { level1: 'Building Materials', level2: 'Sheet Materials', level3: 'OSB Sheets' },
  'LOFT_BOARDS': { level1: 'Building Materials', level2: 'Sheet Materials', level3: 'Loft Boards' },
  'CHIP_BOARD': { level1: 'Building Materials', level2: 'Sheet Materials', level3: 'Chip Board' },
  'HARD_BOARD_SHEETS': { level1: 'Building Materials', level2: 'Sheet Materials', level3: 'Hard Board Sheets' },
  'DOOR_BLANKS': { level1: 'Building Materials', level2: 'Sheet Materials', level3: 'Door Blanks' },

  // Building Materials → Cement & Aggregates
  'BALLAST_&_SUB_BASE': { level1: 'Building Materials', level2: 'Cement & Aggregates', level3: 'Ballast & Sub Base' },
  'CEMENT': { level1: 'Building Materials', level2: 'Cement & Aggregates', level3: 'Cement' },
  'SAND': { level1: 'Building Materials', level2: 'Cement & Aggregates', level3: 'Sand' },
  'GRAVEL': { level1: 'Building Materials', level2: 'Cement & Aggregates', level3: 'Gravel' },
  'TOPSOIL': { level1: 'Building Materials', level2: 'Cement & Aggregates', level3: 'Topsoil' },
  'CEMENT_PLASTICISER_&_DYES': { level1: 'Building Materials', level2: 'Cement & Aggregates', level3: 'Cement Plasticiser & Dyes' },
  'LIMES': { level1: 'Building Materials', level2: 'Cement & Aggregates', level3: 'Limes' },
  'READY_MIXED_CONCRETES_&_MORTAR': { level1: 'Building Materials', level2: 'Cement & Aggregates', level3: 'Ready Mixed Concretes & Mortar' },
  'SCREEDING_&_FLOOR_LEVELLING_COMPOUND': { level1: 'Building Materials', level2: 'Cement & Aggregates', level3: 'Screeding & Floor Levelling Compound' },

  // Building Materials → Plasterboard & Drylining
  'PLASTERBOARD': { level1: 'Building Materials', level2: 'Plasterboard & Drylining', level3: 'Plasterboard' },
  'PLASTER': { level1: 'Building Materials', level2: 'Plasterboard & Drylining', level3: 'Plaster' },
  'COVING': { level1: 'Building Materials', level2: 'Plasterboard & Drylining', level3: 'Coving' },
  'PLASTERING_ADHESIVES': { level1: 'Building Materials', level2: 'Plasterboard & Drylining', level3: 'Plastering Adhesives' },
  'INSULATED_PLASTERBOARD': { level1: 'Building Materials', level2: 'Plasterboard & Drylining', level3: 'Insulated Plasterboard' },
  'METAL_STUDS_&_CEILINGS': { level1: 'Building Materials', level2: 'Plasterboard & Drylining', level3: 'Metal Studs & Ceilings' },
  'BAGGED_PRODUCTS': { level1: 'Building Materials', level2: 'Plasterboard & Drylining', level3: 'Bagged Products' },
  'OTHER_BOARDS': { level1: 'Building Materials', level2: 'Plasterboard & Drylining', level3: 'Other Boards' },
  'DRYLINING_ACCESSORIES': { level1: 'Building Materials', level2: 'Plasterboard & Drylining', level3: 'Drylining Accessories' },

  // Building Materials → Insulation
  'LOFT_INSULATION': { level1: 'Building Materials', level2: 'Insulation', level3: 'Loft Insulation' },
  'INSULATION_BOARD': { level1: 'Building Materials', level2: 'Insulation', level3: 'Insulation Board' },
  'CAVITY_WALL_INSULATION': { level1: 'Building Materials', level2: 'Insulation', level3: 'Cavity Wall Insulation' },
  'INSULATION_FOIL': { level1: 'Building Materials', level2: 'Insulation', level3: 'Insulation Foil' },
  'INSULATION_SLABS': { level1: 'Building Materials', level2: 'Insulation', level3: 'Insulation Slabs' },
  'INSULATION_ROLLS': { level1: 'Building Materials', level2: 'Insulation', level3: 'Insulation Rolls' },
  'INSULATION_ACCESSORIES': { level1: 'Building Materials', level2: 'Insulation', level3: 'Insulation Accessories' },

  // Building Materials → Roofing
  'PVC_CORRUGATED_SHEETS': { level1: 'Building Materials', level2: 'Roofing', level3: 'PVC Corrugated Sheets' },
  'BITUMEN_SHEETS': { level1: 'Building Materials', level2: 'Roofing', level3: 'Bitumen Sheets' },
  'ROOF_FELT': { level1: 'Building Materials', level2: 'Roofing', level3: 'Roof Felt' },
  'ROOF_TILES': { level1: 'Building Materials', level2: 'Roofing', level3: 'Roof Tiles' },
  'LEAD_FLASHING': { level1: 'Building Materials', level2: 'Roofing', level3: 'Lead Flashing' },
  'PITCHED_ROOFING': { level1: 'Building Materials', level2: 'Roofing', level3: 'Pitched Roofing' },
  'FLAT_ROOFING': { level1: 'Building Materials', level2: 'Roofing', level3: 'Flat Roofing' },

  // Building Materials → Nails & Screws
  'SCREWS': { level1: 'Building Materials', level2: 'Nails & Screws', level3: 'Screws' },
  'SEALANTS': { level1: 'Building Materials', level2: 'Nails & Screws', level3: 'Sealants' },
  'FIXINGS': { level1: 'Building Materials', level2: 'Nails & Screws', level3: 'Fixings' },
  'NAILS': { level1: 'Building Materials', level2: 'Nails & Screws', level3: 'Nails' },
  'BONDING_ADHESIVES': { level1: 'Building Materials', level2: 'Nails & Screws', level3: 'Bonding Adhesives' },

  // Building Materials → Guttering & Drainage
  'ROUND_LINE_GUTTERING': { level1: 'Building Materials', level2: 'Guttering & Drainage', level3: 'Round Line Guttering' },
  'SQUARE_LINE_GUTTERING': { level1: 'Building Materials', level2: 'Guttering & Drainage', level3: 'Square Line Guttering' },
  'SOIL_PIPES_&_FITTINGS': { level1: 'Building Materials', level2: 'Guttering & Drainage', level3: 'Soil Pipes & Fittings' },
  'CHANNEL_DRAINAGE': { level1: 'Building Materials', level2: 'Guttering & Drainage', level3: 'Channel Drainage' },

  // Building Materials → Bricks & Lintels
  'BLOCKS': { level1: 'Building Materials', level2: 'Bricks & Lintels', level3: 'Blocks' },
  'BRICKS': { level1: 'Building Materials', level2: 'Bricks & Lintels', level3: 'Bricks' },
  'BLOCK_PAVING': { level1: 'Building Materials', level2: 'Bricks & Lintels', level3: 'Block Paving' },
  'CONCRETE_LINTELS': { level1: 'Building Materials', level2: 'Bricks & Lintels', level3: 'Concrete Lintels' },
  'STEEL_LINTELS': { level1: 'Building Materials', level2: 'Bricks & Lintels', level3: 'Steel Lintels' },
  'PADSTONES': { level1: 'Building Materials', level2: 'Bricks & Lintels', level3: 'Padstones' },
  'BLOCK_&_BEAM_FLOORING': { level1: 'Building Materials', level2: 'Bricks & Lintels', level3: 'Block & Beam Flooring' },

  // Building Materials → Building Supplies
  'BUILDERS\'_METALWORK': { level1: 'Building Materials', level2: 'Building Supplies', level3: 'Builders\' Metalwork' },
  'DAMP_PROOFING': { level1: 'Building Materials', level2: 'Building Supplies', level3: 'Damp Proofing' },
  'PROTECTIVE_SHEETING': { level1: 'Building Materials', level2: 'Building Supplies', level3: 'Protective Sheeting' },
  'FASCIAS_&_SOFFITS': { level1: 'Building Materials', level2: 'Building Supplies', level3: 'Fascias & Soffits' },
  'RAW_MATERIALS': { level1: 'Building Materials', level2: 'Building Supplies', level3: 'Raw Materials' },

  // Flooring and Tiling → Flooring Tools & Accessories
  'RUG_PAD': { level1: 'Flooring and Tiling', level2: 'Flooring Tools & Accessories', level3: 'Rug Pad' },
  'TEXTILE_DEODORIZER': { level1: 'Flooring and Tiling', level2: 'Flooring Tools & Accessories', level3: 'Textile Deodorizer' },
  'WEATHER_STRIPPING': { level1: 'Flooring and Tiling', level2: 'Flooring Tools & Accessories', level3: 'Weather Stripping' },

  // Flooring and Tiling → Vinyl
  'VINYL': { level1: 'Flooring and Tiling', level2: 'Vinyl', level3: 'Vinyl' },

  // Flooring and Tiling → Carpet
  'CARPETING': { level1: 'Flooring and Tiling', level2: 'Carpet', level3: 'Carpeting' },

  // Flooring and Tiling → Rugs
  'RUG': { level1: 'Flooring and Tiling', level2: 'Rugs', level3: 'Rug' },

  // Flooring and Tiling → Stair Runner
  'STAIR_RUNNER': { level1: 'Flooring and Tiling', level2: 'Stair Runner', level3: 'Stair Runner' },

  // Flooring and Tiling → Laminate
  'LAMINATE': { level1: 'Flooring and Tiling', level2: 'Laminate', level3: 'Laminate' },

  // Flooring and Tiling → LVT
  'LVT': { level1: 'Flooring and Tiling', level2: 'LVT', level3: 'LVT' },

  // Flooring and Tiling → Engineered Wood
  'ENGINEERED_WOOD': { level1: 'Flooring and Tiling', level2: 'Engineered Wood', level3: 'Engineered Wood' },

  // Flooring and Tiling → Tiles
  'TILE': { level1: 'Flooring and Tiling', level2: 'Tiles', level3: 'Tile' },

  // Renewable and Energy → EV Charger
  'EV_CHARGER': { level1: 'Renewable and Energy', level2: 'EV Charger', level3: 'EV Charger' },

  // Renewable and Energy → Solar
  'SOLAR_PANELS': { level1: 'Renewable and Energy', level2: 'Solar', level3: 'Solar Panels' },
  'BATTERY_STORAGE': { level1: 'Renewable and Energy', level2: 'Solar', level3: 'Battery Storage' },

  // Heating and Plumbing → Boilers
  'BOILERS': { level1: 'Heating and Plumbing', level2: 'Boilers', level3: 'Boilers' },

  // Gardens and Landscaping → Garden Supplies
  'PLANT_SEED': { level1: 'Gardens and Landscaping', level2: 'Garden Supplies', level3: 'Plant Seed' },
  'ANCHOR_STAKE': { level1: 'Gardens and Landscaping', level2: 'Garden Supplies', level3: 'Anchor Stake' },

  // Doors and Windows → Internal Doors
  'FIRE_RATED_DOORS': { level1: 'Doors and Windows', level2: 'Internal Doors', level3: 'Fire Rated Doors' },
  'OAK_INTERNAL_DOORS': { level1: 'Doors and Windows', level2: 'Internal Doors', level3: 'Oak Internal Doors' },
  'PLYWOOD_FLUSH_DOORS': { level1: 'Doors and Windows', level2: 'Internal Doors', level3: 'Plywood Flush Doors' },
  'PANEL_DOORS': { level1: 'Doors and Windows', level2: 'Internal Doors', level3: 'Panel Doors' },

  // Doors and Windows → External Doors
  'EXTERNAL_FIRE_RATED_DOORS': { level1: 'Doors and Windows', level2: 'External Doors', level3: 'External Fire Rated Doors' },

  // Doors and Windows → Skirting & Architrave
  'ARCHITRAVES': { level1: 'Doors and Windows', level2: 'Skirting & Architrave', level3: 'Architraves' },
  'SKIRTING_BOARD': { level1: 'Doors and Windows', level2: 'Skirting & Architrave', level3: 'Skirting Board' },

  // Doors and Windows → Windows
  'WINDOW_BOARDS': { level1: 'Doors and Windows', level2: 'Windows', level3: 'Window Boards' },

  // Doors and Windows → Door Frames
  'INTERNAL_DOOR_FRAMES': { level1: 'Doors and Windows', level2: 'Door Frames', level3: 'Internal Door Frames' },
}

/**
 * Get category hierarchy for a product type
 */
export function getCategoryForProductType(productType: string) {
  const mapping = PRODUCT_TYPE_TO_CATEGORY[productType]
  
  if (!mapping) {
    return null
  }
  
  return mapping
}

