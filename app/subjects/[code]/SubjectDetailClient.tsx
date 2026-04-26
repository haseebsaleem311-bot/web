'use client';

import { useState, useEffect, useCallback } from 'react';
import PollsSection from '@/app/components/PollsSection';
import { useDownloadManager } from '@/app/lib/hooks/useDownloadManager';
import OfflineSyncButton from '@/components/study/OfflineSyncButton';

const sections = ['All', 'Handouts', 'Midterm Files', 'Final Term Files', 'Solved Assignments', 'GDB Solutions', 'Quiz Files', 'Past Papers', 'Short Notes'];

const categoryLinks: Record<string, string> = {
    'Computer Science': 'https://drive.google.com/drive/folders/1gn9vOlBosa4sco-W_NvgGWgCV432sLdu?usp=drive_link',
    'Management': 'https://drive.google.com/drive/folders/1yLr8EX3ehDdGdhsKI0YZna9Kk2JbtjZe?usp=drive_link',
    'Mathematics': 'https://drive.google.com/drive/folders/11iCga1LlWk5EvpcZykWNr_glURgUeNeo?usp=drive_link',
    'Science': 'https://drive.google.com/drive/folders/11iCga1LlWk5EvpcZykWNr_glURgUeNeo?usp=drive_link',
    'English': 'https://drive.google.com/drive/folders/1zJW41VjmF7YZJU8OfE2TWMk3jXQ0okcD',
    'General': 'https://drive.google.com/drive/folders/1QI9_QgYZU88uulylWksI3mKXECYDkSHB',
    'Others': 'https://drive.google.com/drive/folders/1i3v79NvfvB6-gCq1KgB-jwSLl3OoX9_O',
};

interface SubjectDetailClientProps {
    code: string;
    initialSubject: any;
    initialResources: any[];
}

export default function SubjectDetailClient({ code, initialSubject, initialResources }: SubjectDetailClientProps) {
    const [subject, setSubject] = useState<any>(initialSubject);
    const [dynamicResources, setDynamicResources] = useState<any[]>(initialResources);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [reviewTab, setReviewTab] = useState<'midterm' | 'final'>('midterm');
    const [userRating, setUserRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [reviews, setReviews] = useState<any[]>([]);
    const [isReviewsLoading, setIsReviewsLoading] = useState(true);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const { prefetchFile } = useDownloadManager();

    // Fetch User
    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) setCurrentUser(data.user);
            })
            .catch(err => console.error('Auth check error:', err));
    }, []);

    // Merge static resources from subjects.ts with dynamic ones from Supabase
    const allResources = [...(dynamicResources || []), ...(subject?.resources || [])];

    // Background prefetching for small files
    useEffect(() => {
        if (allResources.length > 0) {
            // Only prefetch the first few small files to avoid overwhelming the network
            allResources.slice(0, 5).forEach(f => {
                let fileId = '';
                if (f.link?.startsWith('/api/download/')) {
                    fileId = f.link.replace('/api/download/', '').split('?')[0];
                } else if (f.link?.includes('/file/d/')) {
                    fileId = f.link.split('/file/d/')[1].split('/')[0];
                }

                if (fileId) {
                    prefetchFile(fileId, f.title || 'Resource', f.size || 0);
                }
            });
        }
    }, [allResources, prefetchFile]);

    // Fetch Reviews
    const fetchReviews = useCallback(async () => {
        setIsReviewsLoading(true);
        try {
            const res = await fetch(`/api/subjects/${code}/reviews?term=${reviewTab}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data);
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setIsReviewsLoading(false);
        }
    }, [code, reviewTab]);

    useEffect(() => {
        if (code) {
            fetchReviews();
        }
    }, [code, fetchReviews]);

    const handleSubmitReview = async () => {
        if (!currentUser) return alert('Please log in to submit a review.');
        if (userRating === 0 || !reviewText.trim()) return alert('Please provide a rating and a comment.');

        setIsSubmittingReview(true);
        try {
            const res = await fetch(`/api/subjects/${code}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: userRating, comment: reviewText, term: reviewTab })
            });

            if (res.ok) {
                setUserRating(0);
                setReviewText('');
                fetchReviews(); // Refresh the list
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to submit review');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleDeleteReview = async (id: string) => {
        if (!confirm('Are you sure you want to delete this review?')) return;
        try {
            const res = await fetch(`/api/subjects/${code}/reviews?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setReviews(prev => prev.filter(r => r.id !== id));
            } else {
                alert('Failed to delete review');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        }
    };


    if (!subject && !isLoading && allResources.length === 0) {
        return (
            <div className="page">
                <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
                    <h1>Subject Not Found</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>The subject code &quot;{code}&quot; was not found in our database.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page" style={{ padding: 0 }}>
            {/* Header */}
            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span className="badge badge-primary" style={{ fontSize: '1.1rem', padding: '6px 16px' }}>{subject?.code}</span>
                    <span className={`diff-${subject?.difficulty?.toLowerCase().replace(' ', '') || 'medium'}`}>{subject?.difficulty || 'Medium'}</span>
                </div>
                <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', marginBottom: '16px' }}>{subject.name}</h1>

                <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    padding: '24px',
                    marginBottom: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}>
                    <h2 style={{ fontSize: '1.3rem', marginBottom: '10px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📘</span> Introduction to {subject?.code || code}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6', margin: 0 }}>
                        {subject.description
                            ? subject.description
                            : `Welcome to the complete resource hub for ${subject.code} (${subject.name}), a ${subject.credit_hours || subject.creditHours || 3}-credit hour course. Access all verified handouts, past papers, solved assignments, midterm/final term files, and quizzes below to boost your preparation. Navigate through the tabs to find exactly what you need.`}
                    </p>
                </div>

                <div className="stat-grid" style={{ marginTop: '24px' }}>
                    <div className="stat-card"><div className="stat-number">{(subject?.rating || 0).toFixed(1)}</div><div className="stat-label">Rating</div></div>
                    <div className="stat-card"><div className="stat-number">{allResources.length}</div><div className="stat-label">Files</div></div>
                    <div className="stat-card"><div className="stat-number">{(subject?.downloads || 0).toLocaleString()}</div><div className="stat-label">Downloads</div></div>
                    <div className="stat-card"><div className="stat-number">{reviews.length}</div><div className="stat-label">Reviews</div></div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <a href={`/quiz/${subject?.code || code}`} className="btn btn-success" style={{ padding: '12px 24px', fontSize: '1.1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        🧠 Start Topic-Wise Quiz
                    </a>
                    <OfflineSyncButton 
                        subjectCode={code} 
                        files={allResources.map(f => ({ link: f.link, title: f.title }))} 
                    />
                </div>

                <div style={{ marginTop: '16px', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                    <strong>Teachers:</strong> {subject.teachers && subject.teachers.length > 0 ? subject.teachers.join(' • ') : 'TBA'} &nbsp; | &nbsp; <strong>Credit Hours:</strong> {subject.credit_hours || subject.creditHours || 3}
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                {sections.map((sec, i) => (
                    <button key={i} className={`tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
                        {sec}
                    </button>
                ))}
            </div>

            {/* Files */}
            <h3 style={{ marginBottom: '16px' }}>{sections[activeTab]}</h3>
            <div style={{ marginBottom: '40px' }}>
                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>Loading files...</div>
                ) : allResources.length > 0 ? (
                    (() => {
                        const activeCategory = sections[activeTab];
                        const categoryFiles = activeCategory === 'All' ? allResources : allResources.filter(f => f.type?.toLowerCase() === activeCategory.toLowerCase());

                        // Build proxy view/download links — hides Google Drive from users
                        const getDriveLinks = (link: string, title?: string) => {
                            if (!link) return { view: '#', download: '#' };

                            // If it's already a full direct HTTP link (like Supabase Storage), use it directly
                            if (link.startsWith('http')) {
                                return { view: link, download: link };
                            }

                            let fileId = '';
                            const encodedTitle = title ? encodeURIComponent(title) : '';

                            // Our proxy URL format: /api/download/DRIVE_FILE_ID
                            if (link.startsWith('/api/download/')) {
                                fileId = link.replace('/api/download/', '').split('?')[0];
                            }
                            // Local uploads directory (legacy support - will be proxied internally)
                            else if (link.startsWith('/uploads/')) {
                                return { view: link, download: link };
                            }
                            // Standard Google Drive URL formats (legacy)
                            else if (link.includes('/file/d/')) {
                                fileId = link.split('/file/d/')[1].split('/')[0];
                            } else if (link.includes('id=')) {
                                fileId = link.split('id=')[1].split('&')[0];
                            } else if (!link.includes('/') && link.length > 15) {
                                fileId = link; // Treat raw string as drive ID
                            }

                            if (fileId) {
                                return {
                                    // Points to our beautiful new viewer page
                                    view: `/view/${fileId}?title=${encodedTitle}`,
                                    download: `/api/download/${fileId}${encodedTitle ? `?title=${encodedTitle}` : ''}`
                                };
                            }

                            return { view: link, download: link };
                        };

                        if (categoryFiles.length === 0) {
                            return (
                                <div className="card" style={{ padding: '30px', textAlign: 'center', background: 'var(--card-bg-hover)' }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📁</div>
                                    <h4>No {activeCategory} found</h4>
                                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Be the first to upload a resource for {subject.code} in this category!</p>
                                </div>
                            );
                        }

                        return (
                            <div style={{ marginBottom: '30px' }}>
                                <h4 style={{
                                    fontSize: '1.1rem',
                                    marginBottom: '12px',
                                    color: 'var(--accent-primary)',
                                    borderBottom: '2px solid var(--accent-primary)',
                                    paddingBottom: '8px'
                                }}>
                                    {activeCategory}
                                </h4>
                                {categoryFiles.map((f, i) => {
                                    const links = getDriveLinks(f.link, f.title);
                                    return (
                                        <div key={i} className="card" style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '12px',
                                            marginBottom: '12px',
                                            padding: '16px 20px',
                                            transition: 'transform 0.2s',
                                        }}>
                                            <div style={{ flex: 1, minWidth: '200px' }}>
                                                <h4 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>{f.title}</h4>
                                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                    📄 {f.type || activeCategory}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <a
                                                    href={links.view}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-secondary btn-sm"
                                                    style={{ minWidth: '80px' }}
                                                >
                                                    👁 View
                                                </a>
                                                <a
                                                    href={links.download}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-primary btn-sm"
                                                    style={{ minWidth: '100px' }}
                                                >
                                                    ⬇ Download
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()
                ) : (
                    <div className="card" style={{ textAlign: 'center', padding: '40px', background: 'var(--card-bg-hover)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📂</div>
                        <h3>No specific files found for {subject.code}</h3>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '8px auto 24px' }}>
                            We haven&apos;t indexed individual files for this subject yet. However, you can check our comprehensive archives.
                        </p>
                        <a href={categoryLinks[subject.category] || categoryLinks['Others']} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                            Access {subject.category} Archive on Drive ↗
                        </a>
                    </div>
                )}
            </div>

            {/* Reviews */}
            <h2 style={{ marginBottom: '20px' }}>⭐ Reviews & Ratings</h2>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <button className={`btn ${reviewTab === 'midterm' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setReviewTab('midterm')}>Midterm Reviews</button>
                <button className={`btn ${reviewTab === 'final' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setReviewTab('final')}>Final Term Reviews</button>
            </div>

            {currentUser ? (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h4 style={{ marginBottom: '12px' }}>Write a Review ({reviewTab === 'midterm' ? 'Midterm' : 'Final Term'})</h4>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} className={`star ${userRating >= s ? 'active' : ''}`} onClick={() => setUserRating(s)} style={{ fontSize: '1.5rem', cursor: 'pointer', color: userRating >= s ? '#eab308' : '#cbd5e1' }}>★</span>
                        ))}
                    </div>
                    <textarea
                        className="form-textarea"
                        placeholder="Share your experience with this subject..."
                        style={{ marginBottom: '12px' }}
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={handleSubmitReview} disabled={isSubmittingReview}>
                        {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            ) : (
                <div className="card" style={{ marginBottom: '24px', textAlign: 'center', padding: '20px' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>You must be logged in to write a review.</p>
                    <a href="/login" className="btn btn-secondary btn-sm" style={{ marginTop: '10px', display: 'inline-block' }}>Log In</a>
                </div>
            )}

            {isReviewsLoading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Loading reviews...</div>
            ) : reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border)', marginBottom: '40px' }}>
                    <p>No reviews have been posted for this category yet. Be the first to review!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                    {reviews.map((rev) => (
                        <div key={rev.id} style={{
                            background: 'var(--bg-secondary)',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {rev.avatar_url ? (
                                        <img src={rev.avatar_url?.startsWith('http') ? rev.avatar_url : `/api/download/${rev.avatar_url}?mode=inline`} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {rev.username?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{rev.username}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'N/A'}</div>
                                    </div>
                                </div>
                                {currentUser?.role === 'owner' && (
                                    <button
                                        onClick={() => handleDeleteReview(rev.id)}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            color: '#ef4444',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        🗑️ Delete
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '2px', marginBottom: '8px', color: '#eab308' }}>
                                {[...Array(5)].map((_, i) => <span key={i}>{i < rev.rating ? '★' : '☆'}</span>)}
                            </div>
                            <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>{rev.comment}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Question Polls */}
            <PollsSection subjectCode={code} />
        </div>
    );
}
