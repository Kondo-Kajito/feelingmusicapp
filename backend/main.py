from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import urllib.request
import urllib.parse
import json
import random
import re
from typing import List

# Gemini APIを使うためのライブラリ
import google.generativeai as genai

GEMINI_API_KEY = "AQ.Ab8RN6INKMI0AQe0FWjri3PFO_ZMEuJzzsuo_uVEyyu7uZ1loQ"
genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel(
    'gemini-2.0-flash',
    generation_config={"response_mime_type": "application/json"}
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 💡 Geminiがダウンした時用の予備データ（先ほどの独自アルゴリズム用）
EMOTION_MAP = {
    "楽しい": {"keywords": ["ポップ", "ダンス", "明るい", "爽快"], "message": "最高にウキウキな気分ですね！さらにテンションが上がるような弾けるナンバーをセレクトしました！✨"},
    "疲れた": {"keywords": ["リラックス", "チル", "アコースティック", "ヒーリング"], "message": "今日もお疲れ様でした。頑張ったあなたを優しく包み込む、心がほっと落ち着く曲たちです。☕"},
    "悲しい": {"keywords": ["バラード", "泣ける", "しっとり", "切ない"], "message": "無理に元気を出さなくても大丈夫ですよ。あなたの涙や寂しさにそっと寄り添ってくれる、温かい名曲を選びました。☔"},
    "イライラ": {"keywords": ["ロック", "激しい", "エネルギッシュ", "パンク"], "message": "モヤモヤした気持ち、吹き飛ばしちゃいましょう！爆音で聴いてスッキリできるような曲をどうぞ！⚡"},
    "緊張": {"keywords": ["クラシック", "ジャズ", "ピアノ", "インスト"], "message": "ドキドキしているあなたへ。深呼吸をひとつして、この心地よい音色に身を委ねてみてくださいね。🍀"},
    "恋": {"keywords": ["ラブソング", "甘い", "ロマンチック"], "message": "胸がキュンとする素敵なシチュエーションですね！とっておきのラブソングたちです。💕"},
    "失恋": {"keywords": ["失恋", "別れ", "泣けるバラード", "切ない"], "message": "辛い思いをしましたね…。今は無理せず、音楽に身を任せて思い切り泣いても大丈夫ですよ。傷ついた心に優しく寄り添う曲を選びました。🌧️"}
}

class EmotionRequest(BaseModel):
    text: str
    genre: str = ""
    favorite_artist: str = ""
    genres: List[str] = []
    eras: List[str] = []
    weather: str = ""
    situation: str = ""

@app.post("/analyze-emotion")
async def analyze_emotion(req: EmotionRequest):
    try:

        #  パターンA: まずは本物のAI（Gemini）を試す
        try:
            print("🤖 Geminiに考えさせています...")
            prompt = f"""
            あなたはユーザーの心に寄り添う、優秀な音楽コンシェルジュです。

            【ユーザーの現在の状態と好み】
            ・今の気分: {req.text}
            ・天候: {req.weather if req.weather else '指定なし'}
            ・シチュエーション: {req.situation if req.situation else '指定なし'}
            ・好きなジャンル: {', '.join(req.genres) if req.genres else '指定なし'}
            ・好きな年代: {', '.join(req.eras) if req.eras else '指定なし'}

            【選曲の絶対条件】
            1. 指定された「好きな年代」にリリースされた、またはその年代を代表する楽曲を必ず選ぶこと。
            2. 指定された「好きなジャンル」に合致する楽曲を選ぶこと。
            3. 今の「天候」や「気分」にぴったり合う楽曲を選ぶこと。

            この条件に最高にマッチする実在する楽曲を3つ選び、iTunes APIで検索しやすいように「アーティスト名 曲名」のキーワードとして出力してください。
            また、選んだ曲が指定された年代や天候にどう合っているかに触れた、ユーザーが嬉しくなるようなDJメッセージを考えてください。

            必ず以下のJSONフォーマットで出力してください。
            {{
                "message": "ユーザーへの温かいDJメッセージ",
                "search_queries": ["アーティスト名 曲名", "アーティスト名 曲名", "アーティスト名 曲名"]
            }}
            """
            
            ai_response = model.generate_content(prompt)
            ai_result = json.loads(ai_response.text)
            
            dj_message = ai_result.get("message", "あなたにぴったりの曲を選びました🎧")
            search_queries = ai_result.get("search_queries", ["ヒット曲"])
            
            print(f"✅ Gemini成功！\n💬 {dj_message}")

            songs_list = []
            for query in search_queries:
                encoded_query = urllib.parse.quote(query)
                url = f"https://itunes.apple.com/search?term={encoded_query}&entity=song&limit=1&country=JP"
                req_itunes = urllib.request.Request(url)
                with urllib.request.urlopen(req_itunes) as res:
                    data = json.loads(res.read().decode())
                    if data['resultCount'] > 0:
                        track = data['results'][0]
                        songs_list.append({
                            "song_title": track.get('trackName', '不明なタイトル'),
                            "artist": track.get('artistName', '不明なアーティスト'),
                            "preview_url": track.get('previewUrl'),
                            "artwork_url": track.get('artworkUrl100'),
                            "duration_ms": track.get('trackTimeMillis', 0)
                        })

            if songs_list:
                return {
                    "message": dj_message,
                    "songs": songs_list
                }
                
        except Exception as gemini_err:
            print(f"⚠️ Geminiが制限に達したため、予備システムに切り替えます: {gemini_err}")
            pass 


        # パターンB: Geminiがダメなら独自アルゴリズム（予備システム）を起動！
        print("🛡️ 予備システムで選曲を開始します...")
        user_text = req.text
        matched_emotion = None
        for key, data in EMOTION_MAP.items():
            if key in user_text:
                matched_emotion = data
                break
        
        query_parts = []
        profile_intro_parts = []
        
        if req.genres:
            chosen_genre = random.choice(req.genres)
            query_parts.append(chosen_genre)
            profile_intro_parts.append(f"お好みの {chosen_genre} をベースに")

        # 🌟 追加：年代（eras）の処理をしっかり追加！
        if req.eras:
            chosen_era = random.choice(req.eras)
            era_jp = chosen_era.replace("'s", "年代") # 90's を 90年代 に変換
            query_parts.append(era_jp)
            profile_intro_parts.append(f"懐かしの「{chosen_era}」の名曲から")

        if req.weather:
            clean_weather = re.sub(r'[^\w\sぁ-んァ-ン一-龥]', '', req.weather).strip()
            if clean_weather:
                # 🌟 改善：天気をそのまま検索すると曲名に「雨」が入る曲しか出ないので、雰囲気に変換
                if "晴れ" in clean_weather: query_parts.append("爽快")
                elif "雨" in clean_weather: query_parts.append("しっとり")
                elif "曇り" in clean_weather: query_parts.append("チル")
            profile_intro_parts.append(f"今の「{req.weather}」の空模様に合わせて")
            
        if req.situation:
            profile_intro_parts.append(f"「{req.situation}」のお供に")
        
        profile_intro = "、".join(profile_intro_parts) + "セレクトしました！\n\n" if profile_intro_parts else ""

        if matched_emotion:
            secret_keyword = random.choice(matched_emotion["keywords"])
            query_parts.append(secret_keyword)
            dj_message = f"{profile_intro}{matched_emotion['message']}"
        else:
            query_parts.append(req.text[:10]) 
            dj_message = f"{profile_intro}「{req.text}」という今の気分に寄り添う曲を見つけました🎧"

        search_query = " ".join(query_parts).strip()
        if not search_query: search_query = "ヒット曲"

        encoded_query = urllib.parse.quote(search_query)
        url = f"https://itunes.apple.com/search?term={encoded_query}&entity=song&limit=30&country=JP"
        
        req_itunes = urllib.request.Request(url)
        with urllib.request.urlopen(req_itunes) as res:
            data = json.loads(res.read().decode())
            if data['resultCount'] > 0:
                tracks = data['results']
                random.shuffle(tracks)
                selected_tracks = tracks[:4]
                
                songs_list = []
                for track in selected_tracks:
                    songs_list.append({
                        "song_title": track.get('trackName', '不明なタイトル'),
                        "artist": track.get('artistName', '不明なアーティスト'),
                        "preview_url": track.get('previewUrl'),
                        "artwork_url": track.get('artworkUrl100'),
                        "duration_ms": track.get('trackTimeMillis', 0)
                    })

                return {"message": dj_message, "songs": songs_list}
            else:
                return {
                    "message": f"ごめんなさい、今の組み合わせだと曲が見つかりませんでした💦 条件を変えてみてください！",
                    "songs": []
                }
        
    except Exception as e:
        print(f"エラー発生: {str(e)}")
        return {"error": f"処理に完全に失敗しました💦\n詳細: {str(e)}"}