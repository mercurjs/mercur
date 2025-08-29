import React, { useState } from 'react'
import { Alert, Button, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Link } from '@react-navigation/native'
import { sdk } from '@/lib/sdk'
import { useCustomer } from '@/providers/customer'

export function Login() {
  const { refreshCustomer } = useCustomer()
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onLogin() {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await sdk.store.auth.authenticate({ email, password })
      await refreshCustomer()
    } catch (e: any) {
      Alert.alert('Login failed', e?.message ?? 'Unknown error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Sign in</Text>
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
        <Button title={isSubmitting ? 'Signing in...' : 'Sign in'} onPress={onLogin} disabled={isSubmitting} />
        <View style={{ height: 8 }} />
        <Text>
          Don't have an account?{' '}
          {/* @ts-ignore - static linking names resolved by createStaticNavigation */}
          <Link to={{ screen: 'Register' }}>Create account</Link>
        </Text>
        <Text>
          Forgot password?{' '}
          {/* @ts-ignore */}
          <Link to={{ screen: 'RequestReset' }}>Reset it</Link>
        </Text>
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


