import { NextRequest, NextResponse } from 'next/server';
import { 
  getCompanyByTicker, 
  fetchInsiderTransactions, 
  calculateSummary 
} from '@/lib/sec-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '90');

  try {
    // Get company info
    const company = await getCompanyByTicker(ticker);
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Fetch transactions
    const transactions = await fetchInsiderTransactions(ticker);
    
    // Calculate summary
    const { summary, byInsider } = calculateSummary(company, transactions, days);

    return NextResponse.json({
      company,
      summary,
      transactions,
      byInsider,
      period: {
        days,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Error fetching insider trading data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insider trading data' },
      { status: 500 }
    );
  }
}
