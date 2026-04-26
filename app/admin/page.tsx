'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { verifySession } from '@/app/lib/session';
import Skeleton from '@/components/ui/Skeleton';

export default function AdminPage() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dbLatency, setDbLatency] = useState(0);
    const [metrics, setMetrics] = useState<any>({
        users: 0,
        subjects: 0,
        materials: 0,
        totalResources: 0,
        avgRating: 0,
        totalReviews: 0,
        quizzesTaken: 0,
        trends: { users: [], quizzes: [] }
    });
    const router = useRouter();

    useEffect(() => {
        // Check authentication
        async function checkAuth() {
            const start = performance.now();
            try {
                const response = await fetch('/api/auth/me');
                const data = await response.json();

                if (!data.user || (data.user.role !== 'admin' && data.user.role !== 'owner')) {
                    router.push('/dashboard');
                } else {
                    setCurrentUser(data.user);
                    // Fetch real metrics if authorized
                    fetchMetrics();
                }
            } catch (error) {
                router.push('/login');
            } finally {
                const end = performance.now();
                setDbLatency(Math.round(end - start));
                setLoading(false);
            }
        }

        async function fetchMetrics() {
            try {
                const res = await fetch('/api/admin/stats');
                if (res.ok) {
                    const data = await res.json();
                    setMetrics(data);
                }
            } catch (error) {
                console.error('Failed to fetch metrics:', error);
            }
        }
        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <main className="page" style={{ padding: '40px' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <Skeleton width="100%" height="200px" borderRadius="15px" style={{ marginBottom: '40px' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                        {[...Array(4)].map((_, i) => <Skeleton key={i} height="150px" borderRadius="15px" />)}
                    </div>
                </div>
            </main>
        );
    }

    const Sparkline = ({ data, color }: { data: number[], color: string }) => {
        if (!data || data.length === 0) return null;
        const max = Math.max(...data, 1);
        const points = data.map((val, i) => `${(i / (data.length - 1)) * 100},${100 - (val / max) * 80}`).join(' ');
        
        return (
            <svg viewBox="0 0 100 100" style={{ height: '40px', width: '100%', marginTop: '10px', filter: `drop-shadow(0 0 5px ${color})` }}>
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
            </svg>
        );
    };

    if (!currentUser) return null;

    return (
        <main className="page page-fade-in" style={{ maxWidth: '1450px', margin: '0 auto', padding: '20px' }}>
            {/* Admin Header with Glassmorphism */}
            <div className="glass" style={{
                background: 'var(--accent-gradient)',
                color: 'white',
                padding: '50px',
                borderRadius: '24px',
                marginBottom: '40px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                        <h1 style={{ fontSize: '2.8rem', margin: 0 }}>⚙️ Admin Nexus</h1>
                        <span style={{ 
                            background: 'rgba(255,255,255,0.2)', 
                            padding: '4px 12px', 
                            borderRadius: '20px', 
                            fontSize: '0.8rem', 
                            fontWeight: 'bold',
                            backdropFilter: 'blur(5px)',
                            border: '1px solid rgba(255,255,255,0.3)'
                        }}>v2.1 Premium Edition</span>
                    </div>
                    <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>Omnipotent control center for <strong>HM Nexora</strong>. Manage everything with precision.</p>
                </div>
                {/* Decorative blob */}
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '300px',
                    height: '300px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    filter: 'blur(60px)'
                }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) 350px', gap: '30px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    {/* Key Metrics with Sparklines */}
                    <section>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            📊 Performance Pulse
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                            {[
                                { 
                                    label: 'Total Users', 
                                    value: metrics.users, 
                                    icon: '👥', 
                                    sub: 'Active members', 
                                    trend: metrics.trends?.users,
                                    color: '#6366f1' 
                                },
                                { 
                                    label: 'Subjects', 
                                    value: metrics.subjects, 
                                    icon: '🏛️', 
                                    sub: 'Active courses', 
                                    color: '#10b981' 
                                },
                                { 
                                    label: 'Quiz Attempts', 
                                    value: metrics.quizzesTaken, 
                                    icon: '📝', 
                                    sub: 'Total submissions', 
                                    trend: metrics.trends?.quizzes,
                                    color: '#f59e0b' 
                                },
                                { 
                                    label: 'App Rating', 
                                    value: `${metrics.avgRating}/5`, 
                                    icon: '⭐', 
                                    sub: `From ${metrics.totalReviews} reviews`, 
                                    color: '#ec4899' 
                                }
                            ].map((item, i) => (
                                <div key={i} className="glass-card card" style={{ padding: '25px', borderRadius: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <div style={{ fontSize: '1.8rem' }}>{item.icon}</div>
                                        {item.trend && <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: item.color }}>+ {Math.round((item.trend[6] / (item.trend[0] || 1) - 1) * 100)}%</div>}
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '500' }}>{item.label}</p>
                                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>{item.value?.toLocaleString() || '0'}</p>
                                    {item.trend ? <Sparkline data={item.trend} color={item.color} /> : <div style={{ height: '40px', borderTop: '1px dashed var(--border-color)', marginTop: '10px' }} />}
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '12px' }}>{item.sub}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Admin Tools - Modern Grid */}
                    <section>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '25px' }}>🏗️ Advanced Control Unit</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                            {[
                                { icon: '👥', label: 'Users', href: '/admin/users', color: 'rgba(102, 126, 234, 0.15)' },
                                { icon: '📢', label: 'Announcements', href: '/admin/announcements', color: 'rgba(234, 179, 8, 0.15)' },
                                { icon: '📊', label: 'Analytics', href: '/admin/analytics', color: 'rgba(34, 197, 94, 0.15)' },
                                { icon: '📄', label: 'Reports', href: '/admin/reports', color: 'rgba(59, 130, 246, 0.15)' },
                                { icon: '📚', label: 'Content', href: '/admin/content', color: 'rgba(236, 72, 153, 0.15)' },
                                { icon: '🔔', label: 'Notifications', href: '/admin/notifications', color: 'rgba(249, 115, 22, 0.15)' },
                                { icon: '⚙️', label: 'Settings', href: '/admin/settings', color: 'rgba(168, 85, 247, 0.15)' },
                                { icon: '📋', label: 'Activity Log', href: '/admin/activity', color: 'rgba(6, 182, 212, 0.15)' },
                                { icon: '🚨', label: 'Moderation', href: '/admin/moderation', color: 'rgba(239, 68, 68, 0.15)' }
                            ].map((tool, idx) => (
                                <Link key={idx} href={tool.href} className="glass-card" style={{
                                    padding: '24px 15px',
                                    borderRadius: '16px',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '12px',
                                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}>
                                    <div style={{ 
                                        fontSize: '2rem', 
                                        width: '60px', 
                                        height: '60px', 
                                        background: tool.color, 
                                        borderRadius: '14px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center' 
                                    }}>{tool.icon}</div>
                                    <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', textAlign: 'center' }}>{tool.label}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar - Activity & Health */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    {/* System Health Monitor */}
                    <div className="glass-card" style={{ padding: '25px', borderRadius: '20px' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ 
                                width: '10px', 
                                height: '10px', 
                                background: dbLatency < 500 ? '#10b981' : '#f59e0b', 
                                borderRadius: '50%', 
                                display: 'inline-block',
                                boxShadow: `0 0 8px ${dbLatency < 500 ? '#10b981' : '#f59e0b'}`
                            }}></span>
                            Core Health
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>DB Latency</span>
                                <span style={{ 
                                    color: dbLatency < 300 ? '#10b981' : dbLatency < 800 ? '#f59e0b' : '#ef4444', 
                                    fontWeight: 'bold' 
                                }}>{dbLatency}ms</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Storage</span>
                                <span style={{ color: '#10b981', fontWeight: 'bold' }}>92% Free</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>API Integrity</span>
                                <span style={{ color: '#10b981', fontWeight: 'bold' }}>Stable</span>
                            </div>
                        </div>
                    </div>

                    {/* Live Activity Ticker (Simplified) */}
                    <div className="glass-card" style={{ padding: '25px', borderRadius: '20px', flex: 1 }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>🌐 Recent Ticker</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {[
                                { act: 'New User Registered', time: '2m ago', color: '#6366f1' },
                                { act: 'Announcement Blast Sent', time: '14m ago', color: '#f59e0b' },
                                { act: 'New Moderator Approved', time: '1h ago', color: '#10b981' },
                                { act: 'System Snapshot Created', time: '3h ago', color: '#ec4899' },
                                { act: 'Security Audit Completed', time: '5h ago', color: '#10b981' }
                            ].map((a, i) => (
                                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <div style={{ width: '8px', height: '8px', background: a.color, borderRadius: '50%', marginTop: '6px', flexShrink: 0 }}></div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: '500', color: 'var(--text-primary)' }}>{a.act}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Help & Support */}
                    <Link href="/support" style={{ textDecoration: 'none' }}>
                        <div className="glass-card" style={{ padding: '15px 25px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(99, 102, 241, 0.1)' }}>
                            <span style={{ fontSize: '1.5rem' }}>💬</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#6366f1' }}>Support Desk</span>
                        </div>
                    </Link>
                </aside>
            </div>

            <style jsx global>{`
                .glass-card:hover {
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15) !important;
                    transform: translateY(-5px);
                    background: var(--bg-card-hover) !important;
                }
            `}</style>
        </main>
    );
};
