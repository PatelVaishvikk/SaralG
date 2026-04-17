import dbConnect from '@/lib/mongodb';
import Rsvp from '@/models/Rsvp';
import { uploadToGitHub } from '@/lib/githubStorage';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await dbConnect();

    const formData = await req.formData();
    const name = formData.get('name');
    const attending = formData.get('attending');
    const guestsCount = formData.get('guestsCount');
    const genderGuess = formData.get('genderGuess') || '';
    const excitedFor = formData.get('excitedFor') || '';
    const message = formData.get('message') || '';
    const image = formData.get('image');

    let imageUrl = '';

    if (image && typeof image === 'object' && image.name && image.size > 0) {
      try {
        const arrayBuffer = await image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadedUrl = await uploadToGitHub(buffer, image.name);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
      }
    }

    const rsvp = await Rsvp.create({
      name,
      attending,
      guestsCount: guestsCount || '1',
      genderGuess,
      excitedFor,
      message,
      imageUrl,
    });

    return NextResponse.json({ success: true, data: rsvp }, { status: 201 });
  } catch (error) {
    console.error('RSVP Server Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}
