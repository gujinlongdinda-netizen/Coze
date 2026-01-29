export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400 }
      );
    }

    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is missing');
    }

    // 👉 这里先不调用 Brevo，做“接口存活测试”
    console.log('Send code to:', email);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (err) {
    console.error('SEND CODE ERROR:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500 }
    );
  }
}
