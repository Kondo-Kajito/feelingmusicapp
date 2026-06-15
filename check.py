# check.py
from google import genai

# あなたのAPIキー
GEMINI_API_KEY = "AQ.Ab8RN6INKMI0AQe0FWjri3PFO_ZMEuJzzsuo_uVEyyu7uZ1loQ"
client = genai.Client(api_key=GEMINI_API_KEY)

print("🔍 使えるAIモデルの一覧を取得中...")

try:
    # 使えるAIのリストを取得して、画面に表示する
    for m in client.models.list():
        print(m.name)
    print("✅ 取得完了！")
except Exception as e:
    print(f"❌ エラーが発生しました: {e}")