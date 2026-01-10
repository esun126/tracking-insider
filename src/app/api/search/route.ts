import { NextRequest, NextResponse } from 'next/server';
import { searchCompanies } from '@/lib/sec-api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 1) {
    return NextResponse.json({ companies: [] });
  }

  try {
    const companies = await searchCompanies(query);
    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search companies' },
      { status: 500 }
    );
  }
}
