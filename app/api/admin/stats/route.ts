import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { verifySession } from '@/app/lib/session';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'all'; // 7d, 30d, all

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifySession(sessionCookie.value);
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const now = new Date();
        let rangeDate = new Date();
        let prevRangeDate = new Date();

        if (range === '7d') {
            rangeDate.setDate(now.getDate() - 7);
            prevRangeDate.setDate(now.getDate() - 14);
        } else if (range === '30d') {
            rangeDate.setDate(now.getDate() - 30);
            prevRangeDate.setDate(now.getDate() - 60);
        } else {
            rangeDate = new Date(0); // Beginning of time
            prevRangeDate = new Date(0);
        }

        // Fetch counts in parallel
        const [
            { count: userCount, error: userError },
            { count: prevUserCount, error: prevUserError },
            { count: subjectCount, error: subjectError },
            { count: quizCount, error: quizError },
            { count: prevQuizCount, error: prevQuizError },
            { data: reviews, error: reviewError }
        ] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }),
            range !== 'all' ? supabase.from('users').select('*', { count: 'exact', head: true }).lt('created_at', rangeDate.toISOString()) : Promise.resolve({ count: 0, error: null }),
            supabase.from('subjects').select('*', { count: 'exact', head: true }),
            supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }),
            range !== 'all' ? supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }).lt('created_at', rangeDate.toISOString()) : Promise.resolve({ count: 0, error: null }),
            supabase.from('subject_reviews').select('rating')
        ]);

        if (userError || subjectError || quizError || reviewError) {
            console.error('Stats fetch error:', { userError, subjectError, quizError, reviewError });
            return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
        }

        // Calculate average rating
        const avgRating = reviews && reviews.length > 0
            ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
            : 0;

        // Calculate growth (for reports)
        const recentUsers = range !== 'all' ? (userCount || 0) - (prevUserCount || 0) : userCount || 0;
        const recentQuizzes = range !== 'all' ? (quizCount || 0) - (prevQuizCount || 0) : quizCount || 0;

        // --- NEW: 7-Day Trend Logic for Sparklines ---
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const [
            { data: trendUsers, error: tUserError },
            { data: trendQuizzes, error: tQuizError }
        ] = await Promise.all([
            supabase.from('users').select('created_at').gt('created_at', last7Days.toISOString()),
            supabase.from('quiz_attempts').select('completed_at').gt('completed_at', last7Days.toISOString())
        ]);

        const getTrendData = (data: any[] = [], dateKey: string) => {
            const counts = new Array(7).fill(0);
            const today = new Date();
            
            data.forEach(item => {
                const itemDate = new Date(item[dateKey]);
                const diffDays = Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays < 7) {
                    counts[6 - diffDays]++; // 0 is today, 6 is 6 days ago
                }
            });
            return counts;
        };

        const userTrend = getTrendData(trendUsers || [], 'created_at');
        const quizTrend = getTrendData(trendQuizzes || [], 'completed_at');

        return NextResponse.json({
            users: userCount || 0,
            subjects: subjectCount || 0,
            quizzesTaken: quizCount || 0,
            avgRating: parseFloat(avgRating.toFixed(1)),
            totalReviews: reviews?.length || 0,
            growth: {
                users: recentUsers,
                quizzes: recentQuizzes,
                period: range
            },
            trends: {
                users: userTrend,
                quizzes: quizTrend
            }
        });
    } catch (e) {
        console.error('Dashboard stats API error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
