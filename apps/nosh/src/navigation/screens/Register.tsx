import React, { useState } from 'react'
import { Alert, Button, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native'
import { sdk } from '@/lib/sdk'
import { useCustomer } from '@/providers/customer'

export function Register() {
  const { refreshCustomer } = useCustomer()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onRegister() {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      try {
        // Register the customer identity
        await sdk.auth.register("customer", "emailpass", { email, password })
      } catch (err: any) {
        // If register failed due to existing identity, try login
        // This allows admin identities to also become customers
        await sdk.auth.login("customer", "emailpass", { email, password })
      }

      // Create the customer using the authenticated context
      await sdk.store.customer.create({
        email,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      })

      // Exchange registration token for an authenticated token with actor context
      await sdk.auth.refresh()

      await refreshCustomer()
    } catch (e: any) {
      Alert.alert('Registration failed', e?.message ?? 'Unknown error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Create account</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="First name"
            autoCapitalize="words"
            value={firstName}
            onChangeText={setFirstName}
          />
          <View style={{ width: 12 }} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Last name"
            autoCapitalize="words"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Button title={isSubmitting ? 'Creating...' : 'Create account'} onPress={onRegister} disabled={isSubmitting} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 24, gap: 12, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
})


