"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Lock, Mail, Chrome } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState("")

  // ✅ Google login (optional)
  const handleSocialLogin = (provider) => {
    setSocialLoading(provider)
    setErrorMsg("")
    if (provider === "google") {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL_AUTH}/auth/google`
    }
  }

  // ✅ Basic input validation
  const validateInputs = () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.")
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrorMsg("Please enter a valid email address.")
      return false
    }
    return true
  }

  // ✅ Form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")

    if (!validateInputs()) {
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL_AUTH}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Login failed")

      // ✅ Store token
      localStorage.setItem("token", data.token)

      // ✅ Always redirect to pricing
      setTimeout(() => {
        router.push("/pricing")
      }, 1000)
    } catch (error) {
      console.error("Login error:", error)
      setErrorMsg(error.message)
    }

    setIsLoading(false)
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden flex items-center justify-center">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />

      {/* Gradient Orbs - Adjusted positioning */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-white/5 to-transparent rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-gradient-to-l from-white/5 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-r from-white/3 to-transparent rounded-full blur-2xl animate-pulse delay-500" />

      <div className="relative z-10 w-full max-w-md px-6 h-full flex flex-col justify-center">
        {/* Header - Reduced spacing */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-4">
            <Lock className="w-4 h-4 text-white" />
            <span className="text-white/80 text-sm font-medium">SECURE LOGIN</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent mb-3 leading-tight">
            Welcome Back
          </h1>
          <p className="text-white/60 text-base">Sign in to your account</p>
        </div>

        {/* Login Form - Reduced padding and spacing */}
        <div className="relative backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 p-6 rounded-3xl border border-white/20 shadow-2xl shadow-white/10">
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent opacity-50" />

          <div className="relative z-10">
            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm">
                <p className="text-center text-sm text-red-300">{errorMsg}</p>
              </div>
            )}

            {/* Google Login */}
            {/* <div className="mb-6">
              <button
                onClick={() => handleSocialLogin("google")}
                disabled={socialLoading === "google"}
                className="w-full flex items-center justify-center px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-2xl border border-white/20 hover:border-white/30 transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed backdrop-blur-sm"
              >
                {socialLoading === "google" ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                ) : (
                  <Chrome className="w-5 h-5 mr-3" />
                )}
                Continue with Google
              </button>
            </div> */}

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gradient-to-r from-transparent via-black to-transparent text-white/60">
                  continue with email
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField label="Email Address" value={email} onChange={setEmail} type="email" icon={Mail} />
              <InputField label="Password" value={password} onChange={setPassword} type="password" icon={Lock} />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-white hover:bg-white/90 disabled:bg-white/50 text-black font-semibold rounded-2xl shadow-lg shadow-white/20 transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mr-3"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Forgot Password */}
            <div className="text-center mt-4">
              <Link
                href="/forgot-password"
                className="text-white/60 hover:text-white text-sm transition-all duration-300 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
        </div>

        {/* Sign Up Link - Reduced spacing */}
        <div className="text-center mt-6">
          <p className="text-white/60 text-sm">
            {"Don't have an account? "}
            <Link
              href="/signup"
              className="text-white hover:text-white/80 font-semibold transition-all duration-300 hover:underline"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, type, icon: Icon }) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white/80">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-white/40" />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={`Enter your ${label.toLowerCase()}`}
          className={`
            w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border text-white placeholder-white/40 
            focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 
            transition-all duration-300 backdrop-blur-sm
            ${isFocused ? "border-white/30 bg-white/10" : "border-white/10"}
          `}
          required
        />
      </div>
    </div>
  )
}
