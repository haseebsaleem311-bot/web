import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// GET: List all content (both pending and approved)
export async function GET() {
    try {
        // Fetch pending uploads with exact count
        const { data: pending, count: pendingCount, error: pendingError } = await supabase
            .from('pending_uploads')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(0, 4999); // Increase limit to 5000 items

        if (pendingError) {
            console.error('Error fetching pending uploads:', pendingError);
            return NextResponse.json({ error: 'Failed to fetch pending uploads' }, { status: 500 });
        }

        // Fetch approved materials with exact count
        const { data: approved, count: approvedCount, error: approvedError } = await supabase
            .from('approved_materials')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(0, 4999); // Increase limit to 5000 items

        if (approvedError) {
            console.error('Error fetching approved materials:', approvedError);
            return NextResponse.json({ error: 'Failed to fetch approved materials' }, { status: 500 });
        }

        // Format pending items
        const formattedPending = (pending || []).map(p => ({
            id: p.id,
            code: p.code,
            title: p.title,
            type: p.type || 'material',
            link: p.link,
            rawDriveId: p.link,
            submittedBy: p.submitted_by || 'Unknown User',
            date: p.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            status: 'pending'
        }));

        // Format approved items
        const formattedApproved = (approved || []).map(a => ({
            id: a.id,
            code: a.code,
            title: a.title,
            type: a.type || 'material',
            link: a.link,
            rawDriveId: a.link,
            submittedBy: a.submitted_by || 'Unknown User',
            date: a.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            status: 'approved'
        }));

        // Combine all content
        const allContent = [...formattedPending, ...formattedApproved];

        return NextResponse.json({
            data: allContent,
            counts: {
                pending: pendingCount || 0,
                approved: approvedCount || 0,
                total: (pendingCount || 0) + (approvedCount || 0)
            }
        });
    } catch (e) {
        console.error('Error fetching all content:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
