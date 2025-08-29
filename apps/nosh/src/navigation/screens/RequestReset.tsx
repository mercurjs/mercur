import React, { useState } from 'react'
import { Alert, Button, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native'
import { sdk } from '@/lib/sdk'

export function RequestReset() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onRequest() {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      // The route always returns success to avoid email enumeration.
      // SDK method name may vary with versions; use requestPasswordReset if available.
      // @ts-ignore
      if (sdk.store?.auth?.requestPasswordReset) {
        // @ts-ignore
        await sdk.store.auth.requestPasswordReset({ identifier: email })
      } else {
        // Fallback to manual call when SDK sugar is missing
        await sdk.client.request('POST', '/auth/customer/emailpass/reset-password', {
          body: { identifier: email },
        })
      }
      Alert.alert('Check your email', 'If the email exists, a reset link was sent.')
    } catch (e: any) {
      // Still show success per docs
      Alert.alert('Check your email', 'If the email exists, a reset link was sent.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Reset password</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <Button title={isSubmitting ? 'Requesting...' : 'Send reset link'} onPress={onRequest} disabled={isSubmitting} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 24, gap: 12, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '600', marginBottom: 12 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
})


