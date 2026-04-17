import dbConnect from '@/lib/mongodb';
import Rsvp from '@/models/Rsvp';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('key');

    // Simple protection — change this key to whatever you want
    if (secret !== 'saral2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rsvps = await Rsvp.find({}).sort({ createdAt: -1 }).lean();

    // Build CSV
    const headers = ['Name', 'Attending', 'Guests', 'Gender Guess', 'Has Photo', 'Submitted'];
    const rows = rsvps.map(r => [
      `"${(r.name || '').replace(/"/g, '""')}"`,
      r.attending || '',
      r.guestsCount || '',
      r.genderGuess || '',
      r.imageData ? 'Yes' : 'No',
      r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="rsvp-responses.csv"',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
