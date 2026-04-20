import dbConnect from '@/lib/mongodb';
import Rsvp from '@/models/Rsvp';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('key');

    // Simple protection matching the export route
    if (secret !== 'saral2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rsvps = await Rsvp.find({}).sort({ createdAt: -1 }).lean();

    // Calculate Stats
    const stats = {
      totalResponses: rsvps.length,
      attendingYes: rsvps.filter(r => r.attending === 'yes').length,
      attendingNo: rsvps.filter(r => r.attending === 'no').length,
      totalGuests: rsvps.reduce((acc, r) => {
        if (r.attending === 'no') return acc;
        const count = r.guestsCount === '6+' ? 6 : parseInt(r.guestsCount) || 1;
        return acc + count;
      }, 0),
      imagesUploaded: rsvps.filter(r => r.imageUrl).length,
      genderGuess: {
        Boy: rsvps.filter(r => r.genderGuess === 'Boy').length,
        Girl: rsvps.filter(r => r.genderGuess === 'Girl').length,
        Surprise: rsvps.filter(r => r.genderGuess === 'Surprise').length,
        Unspecified: rsvps.filter(r => !r.genderGuess).length,
      }
    };

    return NextResponse.json({
      success: true,
      stats,
      responses: rsvps.map(r => ({
        id: r._id,
        name: r.name,
        attending: r.attending,
        guestsCount: r.guestsCount,
        genderGuess: r.genderGuess,
        hasImage: !!r.imageUrl,
        imageUrl: r.imageUrl,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
