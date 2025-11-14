## 🌟 My Daily Sketch: AI Visual Diary  
**Photos + Voice → Emotional Sketch & Diary Generation**  
An AI-powered visual diary app built with Google Gemini multimodal capabilities.

### 🚀 Demo & Project Start

| Item | Link | Description |
|------|------|-------------|
| **Web App (Cloud Run)** | [*(Diary App)*](https://my-daily-sketch-ai-visual-diary-961111421465.us-west1.run.app/) | Final deployed version of the visual diary app |
| **Google AI Studio Original Project** | [*(Original Project)*](https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221Z-i9EhBbdlwnqFXO4dkJOBT_Ed9M85Bk%22%5D,%22action%22:%22open%22,%22userId%22:%22100051609439279756383%22,%22resourceKeys%22:%7B%7D%7D&usp=sharing) | Duplicate and customize the project for development |


### 🛠 Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS  
- **AI Engine:** Google Gemini API (`@google/genai`)  
- **Infra / App Logic:**  
  - Web Audio API  
  - Audio Streaming  
  - API Request Queue (for rate-limit handling)  
  - Exponential Backoff (automatic retry logic)


### 💡 Core Features (Integrated Gemini Modules)

| Category | Feature | Model / Tech | Code Location |
|----------|---------|--------------|----------------|
| **Audio** | 🎙 Real-time Speech-to-Text | `gemini-2.5-flash-native-audio` (Streaming) | `DiaryEntryForm.tsx` |
| **Multimodal** | 🎨 Emotional Sketch Generation (Image-to-Image) | `gemini-2.5-flash-image` | `geminiService.ts` |
| **Tool Use** | 🗺 Location Search & Extraction | `gemini-2.5-flash` + Google Maps API | `geminiService.ts` |
| **NLG** | 📝 Emotional Diary Text Generation | `gemini-2.5-flash` | `geminiService.ts` |
| **Structured Output** | 📊 Daily Summary (JSON Schema) | `gemini-2.5-pro` | `geminiService.ts` |


### ⚙️ System Architecture

**1. Multimodal Interaction Flow**  
A sequential Gemini pipeline based on user inputs (photo, voice, location):

1. Voice → Text (STT)  
2. Text → Diary creation (NLG)  
3. Text + Image → Emotional sketch generation  
4. Daily logs → JSON Summary creation  
5. UI displays the diary card & summary modal  

**2. Stable & Reliable API Call Structure**

#### ✔ `apiQueue.ts`
- Limits concurrent requests (MaxConcurrent = 2)  
- Enforces delay between calls → prevents rate-limit & overload issues  

#### ✔ `withRetry()`
- Automatically retries on 503 / Unavailable  
- Applies Exponential Backoff  
- Ensures stable API operations  


### 💻 Local Development Guide

**1) Clone Repository**
```bash
git clone https://github.com/YourUsername/my-daily-sketch.git
cd my-daily-sketch

```

**2) Install Dependencies**
```bash
npm install
```

**3) Set Environment Variables**

루트에 .env.local 파일 생성 후 아래 내용 추가:
```bash
VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

**4) Run Dev Server**
```bash
npm run dev
```
브라우저에서 자동 실행됩니다.
