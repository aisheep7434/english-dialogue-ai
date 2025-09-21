import { NextRequest, NextResponse } from 'next/server';
import { GenerateDialogueRequest, GenerateDialogueResponse, Dialogue, DialogueLine } from '@/types';
import { utils } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    // 获取请求体
    const body: GenerateDialogueRequest = await request.json();
    const { words } = body;

    // 验证输入
    if (!words || !Array.isArray(words) || words.length < 2) {
      return NextResponse.json(
        { error: '请至少输入两个有效的单字' },
        { status: 400 }
      );
    }

    // 获取API Key
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!apiKey) {
      return NextResponse.json(
        { error: '缺少API Key' },
        { status: 401 }
      );
    }

    // 构建AI提示词
    const prompt = `## Persona & Role
You are an expert English dialogue writer and a creative ESL teacher. Your core mission is to create dialogues that sound **genuinely authentic and natural**, as if they were spoken by native speakers in a real, everyday situation.

**Guiding Principles:**
1. **Everyday Authenticity:** Your dialogues must mirror real, casual conversations found in **everyday life**. Focus on common situations like making plans, grocery shopping, talking about hobbies, ordering food, or discussing a recent movie. This means you **must use common contractions** (e.g., \`I'm\`, \`it's\`, \`don't\`, \`you've\`) and simple conversational fillers (e.g., \`Oh\`, \`Well\`, \`Hmm\`, \`You know\`) to make the speech sound fluid and real.
2. **Simple & Accessible:** The language must be simple, clear, and easy for **beginner-to-intermediate learners** to understand. Avoid complex grammar, obscure idioms, or overly formal language. The goal is for learners to easily grasp the context and vocabulary in a common, everyday setting.
3. **Natural Flow:** Conversations should have a logical, natural flow. A good dialogue involves questions, answers, reactions, and follow-up comments. It shouldn't just be two people stating facts; it must feel like a **genuine, interactive chat**.

## Task
Your task is to take a list of English words and create one or more **short, authentic, and easy-to-understand dialogues** that use every single word from the list. The final output must be a valid JSON array, strictly following the format specified below.

## Workflow & Rules
1. **Analyze and Group:** Analyze the entire list of words.
2. **Identify Themes:** Group the words into logical, **everyday themes** if they cannot all fit into a single, natural conversation. Creating multiple dialogues is encouraged.
3. **Create a Title:** For each dialogue, create a short, descriptive title that reflects its everyday situation (e.g., "Catching Up with a Friend," "Planning a Weekend Trip").
4. **Write Lifelike Dialogue:** For each theme, write a dialogue between two people (e.g., A and B). The conversation **must be set in a common, everyday situation** (e.g., at a café, at home, on the phone). It should have a natural back-and-forth rhythm with questions, answers, and reactions, just like a real chat between friends or family.
5. **Integrate Words Naturally:** Weave the provided words into the dialogue seamlessly. The words should not feel forced or out of place.
6. **Ensure Simplicity:** All surrounding language (words not on the provided list) must be common, everyday English suitable for learners.
7. **Guarantee Completeness:** You MUST use every single word from the original list exactly as provided.
8. **Format Correctly (Crucial):** Your entire output must be a single, valid JSON array. Do not include any text or explanations outside of the JSON structure.

## Output Format Specification
Your final output MUST be a single, valid JSON array \`[...]\`.
* Each dialogue must be a separate JSON object \`{...}\` inside the array.
* Each object must contain these three exact keys:
  1. \`"Dialogue title"\`: A string for the dialogue's title.
  2. \`"Dialogue content"\`: A single string containing the full conversation. You **must** use \`\\n\` to separate lines for different speakers (e.g., \`"A: Hey, what's up?\\nB: Oh, not much. Just getting some coffee."\`).
  3. \`"Words Used"\`: A JSON array of strings, listing the words from the input that were used in that specific dialogue.

### Example JSON Structure:
\`\`\`json
[
    {
        "Dialogue title": "Title for Dialogue 1",
        "Dialogue content": "A: This is the first line.\\nB: This is the second line.",
        "Words Used": ["word_a", "word_b", "word_c"]
    },
    {
        "Dialogue title": "Title for Dialogue 2",
        "Dialogue content": "A: Another conversation starts here.\\nB: And it ends here.",
        "Words Used": ["word_d", "word_e", "word_f"]
    }
]
\`\`\`

## Input Words List:
${words.join(', ')}`;

    // 调用DeepSeek API
    const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error('DeepSeek API Error:', errorText);
      return NextResponse.json(
        { error: '对话生成失败，请检查您的API Key或网络连接' },
        { status: 500 }
      );
    }

    const deepseekData = await deepseekResponse.json();
    const aiResponse = deepseekData.choices[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json(
        { error: '生成对话失败，AI返回空内容' },
        { status: 500 }
      );
    }

    // 解析AI返回的JSON
    let dialoguesData;
    try {
      // 尝试提取JSON部分
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
      dialoguesData = JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to parse AI response:', aiResponse);
      return NextResponse.json(
        { error: '生成的对话格式有误，请重试' },
        { status: 500 }
      );
    }

    // 转换为我们的数据格式
    const dialogueId = utils.generateId();
    const lines: DialogueLine[] = [];
    let allWordsUsed: string[] = [];

    // 处理多个对话或单个对话
    if (Array.isArray(dialoguesData) && dialoguesData.length > 0) {
      // 取第一个对话作为主要对话
      const firstDialogue = dialoguesData[0];
      const content = firstDialogue['Dialogue content'] || '';
      const wordsUsed = firstDialogue['Words Used'] || [];
      
      // 解析对话内容
      const dialogueLines = content.split('\n').filter((line: string) => line.trim());
      dialogueLines.forEach((line: string, index: number) => {
        const match = line.match(/^([AB]):\s*(.+)$/);
        if (match) {
          const [, speaker, text] = match;
          lines.push({
            id: utils.generateId(),
            speaker: speaker as 'A' | 'B',
            text: text.trim(),
            isLoadingAudio: false,
          });
        }
      });

      allWordsUsed = wordsUsed;
    }

    // 创建对话对象
    const dialogue: Dialogue = {
      id: dialogueId,
      title: dialoguesData[0]?.['Dialogue title'] || '英语对话练习',
      lines,
      wordsUsed: allWordsUsed,
      createdAt: new Date().toISOString(),
    };

    const response: GenerateDialogueResponse = {
      dialogue,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Generate dialogue error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}