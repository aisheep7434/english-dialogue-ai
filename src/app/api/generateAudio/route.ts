import { NextRequest, NextResponse } from 'next/server';
import { GenerateAudioRequest, GenerateAudioResponse } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface VolcanoTTSRequest {
  app: {
    appid: string;
    token: string;
    cluster: string;
  };
  user: {
    uid: string;
  };
  audio: {
    voice_type: string;
    encoding: string;
    speed_ratio: number;
    volume_ratio: number;
    pitch_ratio: number;
  };
  request: {
    reqid: string;
    text: string;
    text_type: string;
    operation: string;
    with_frontend: number;
    frontend_type: string;
  };
}

interface VolcanoTTSResponse {
  message: string;
  code: number;
  operation: string;
  sequence: number;
  data?: string; // base64 encoded audio data
}

export async function POST(request: NextRequest) {
  try {
    // 获取请求体
    const body: GenerateAudioRequest = await request.json();
    const { text, voice } = body;

    // 验证输入
    if (!text || !voice) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 获取火山引擎配置
    const appid = process.env.VOLCANO_APPID;
    const accessToken = process.env.VOLCANO_ACCESS_TOKEN;
    const cluster = process.env.VOLCANO_CLUSTER || 'volcano_tts';
    const host = process.env.VOLCANO_HOST || 'openspeech.bytedance.com';

    if (!appid || !accessToken) {
      console.error('Missing Volcano TTS configuration');
      return NextResponse.json(
        { error: '服务配置错误，请联系管理员' },
        { status: 500 }
      );
    }

    // 构建火山引擎TTS请求
    const apiUrl = `https://${host}/api/v1/tts`;
    const headers = {
      'Authorization': `Bearer;${accessToken}`,
      'Content-Type': 'application/json'
    };

    const requestJson: VolcanoTTSRequest = {
      app: {
        appid: appid,
        token: 'access_token',
        cluster: cluster
      },
      user: {
        uid: '388808087185088'
      },
      audio: {
        voice_type: voice,
        encoding: 'mp3',
        speed_ratio: 1.0,
        volume_ratio: 1.0,
        pitch_ratio: 1.0,
      },
      request: {
        reqid: uuidv4(),
        text: text,
        text_type: 'plain',
        operation: 'query',
        with_frontend: 1,
        frontend_type: 'unitTson'
      }
    };

    console.log('Calling Volcano TTS API with:', {
      url: apiUrl,
      voice: voice,
      textLength: text.length
    });

    // 调用火山引擎TTS API
    const volcanoResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestJson),
    });

    if (!volcanoResponse.ok) {
      const errorText = await volcanoResponse.text();
      console.error('Volcano TTS API Error:', volcanoResponse.status, errorText);
      return NextResponse.json(
        { error: '音频生成失败，请稍后重试' },
        { status: 500 }
      );
    }

    const volcanoData: VolcanoTTSResponse = await volcanoResponse.json();
    console.log('Volcano TTS Response:', {
      code: volcanoData.code,
      message: volcanoData.message,
      hasData: !!volcanoData.data
    });

    if (volcanoData.code !== 3000 || !volcanoData.data) {
      console.error('Volcano TTS failed:', volcanoData.message);
      return NextResponse.json(
        { error: `音频生成失败: ${volcanoData.message}` },
        { status: 500 }
      );
    }

    // 返回base64编码的音频数据作为data URL
    const audioUrl = `data:audio/mp3;base64,${volcanoData.data}`;

    const response: GenerateAudioResponse = {
      url: audioUrl,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Generate audio error:', error);
    return NextResponse.json(
      { error: '音频生成失败，请检查网络连接' },
      { status: 500 }
    );
  }
}