import React, { useMemo, useState } from 'react'
import { Alert, Button, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native'
import * as Linking from 'expo-linking'
import { sdk } from '@/lib/sdk'

export function ResetPassword() {
  const url = Linking.useURL()
  const params = useMemo(() => {
    try {
      const parsed = url ? new URL(url) : null
      return {
        token: parsed ? parsed.searchParams.get('token') ?? '' : '',
        email: parsed ? parsed.searchParams.get('email') ?? '' : '',
      }
    } catch {
      return { token: '', email: '' }
    }
  }, [url])

  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onReset() {
    if (isSubmitting) return
    if (!params.token || !params.email) {
      Alert.alert('Invalid link', 'Missing token or email in the link')
      return
    }
    setIsSubmitting(true)
    try {
      // As of v2.6, token must be in Authorization: Bearer header
      // Use low-level client to attach header if SDK sugar not present
      // @ts-ignore
      if (sdk.store?.auth?.resetPassword) {
        // @ts-ignore
        await sdk.store.auth.resetPassword({ token: params.token, email: params.email, password })
      } else {
        await sdk.client.request('POST', '/auth/customer/emailpass/update', {
          headers: { Authorization: `Bearer ${params.token}` },
          body: { email: params.email, password },
        })
      }
      Alert.alert('Password updated', 'You can now sign in with your new password.')
    } catch (e: any) {
      Alert.alert('Reset failed', e?.message ?? 'Unknown error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Set a new password</Text>
        <Text style={{ color: '#666' }}>{params.email}</Text>
        <TextInput
          style={styles.input}
          placeholder="New password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Button title={isSubmitting ? 'Updating...' : 'Update password'} onPress={onReset} disabled={isSubmitting} />
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


