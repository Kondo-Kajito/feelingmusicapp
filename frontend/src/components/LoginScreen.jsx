import { useState } from "react";
import { API_BASE_URL, AUTH_TOKEN_KEY } from "../config";

function LoginScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password.trim()) {
      setError("ユーザー名とパスワードを入力してください");
      return;
    }

    if (mode === "register" && trimmedUsername.length < 3) {
      setError("ユーザー名は3文字以上で入力してください");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body =
        mode === "login"
          ? { username: trimmedUsername, password }
          : {
              username: trimmedUsername,
              password,
              display_name: displayName.trim() || trimmedUsername,
            };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = data.detail;
        setError(
          typeof detail === "string"
            ? detail
            : detail?.[0]?.msg || "認証に失敗しました",
        );
        return;
      }

      localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
      onLoginSuccess(data.user);
    } catch {
      setError("サーバーに接続できませんでした。しばらくしてからお試しください");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <p className="auth-subtitle">MOODTUNES AI</p>
        <h1 className="auth-title">
          {mode === "login" ? "ログイン" : "新規登録"}
        </h1>
        <p className="auth-desc">
          {mode === "login"
            ? "アカウントにログインして、あなただけの音楽体験を始めましょう"
            : "アカウントを作成して、好みの設定やライブラリを保存できます"}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            ログイン
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            新規登録
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="auth-field">
              <span>表示名（任意）</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例: 音楽好き太郎"
                maxLength={64}
              />
            </label>
          )}

          <label className="auth-field">
            <span>ユーザー名</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="3文字以上"
              autoComplete="username"
              maxLength={32}
            />
          </label>

          <label className="auth-field">
            <span>パスワード</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6文字以上"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              maxLength={128}
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "処理中..."
              : mode === "login"
                ? "ログイン"
                : "アカウントを作成"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginScreen;
