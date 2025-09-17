// import { NextRequest, NextResponse } from 'next/server';
// import { requireAuth } from '@/hooks/AuthHooks';
// import { PurchaseCreditsRequestSchema } from '@/schema/study-hub-schemas';
// import { purchaseCredits } from '@/hooks/UserHooks';

// export async function POST(request: NextRequest) {
//   try {
//     const user = await requireAuth(request);
//     const body = await request.json();
//     const validatedData = PurchaseCreditsRequestSchema.parse(body);
    
//     const transactionId = await purchaseCredits(user.id, validatedData);
    
//     return NextResponse.json(transactionId);
//   } catch (error) {
//     console.error('Purchase credits error:', error);
//     if (error instanceof Error && error.message === 'Unauthorized') {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }
//     if (error instanceof Error) {
//       return NextResponse.json({ error: error.message }, { status: 400 });
//     }
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }