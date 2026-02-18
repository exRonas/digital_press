<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use App\Models\IssueStat;
use App\Models\Publication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StatisticsController extends Controller
{
    public function index()
    {
        // 1. General Stats
        $totalDocuments = Issue::count();
        $countRu = Issue::where('language', 'ru')->count();
        $countKz = Issue::where('language', 'kz')->count();
        
        // Count new issues this month
        $newIssues = Issue::whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->count();
            
        // Total Views and Downloads from stats
        $totalViews = IssueStat::sum('views_count');
        $totalDownloads = IssueStat::sum('downloads_count');

        // 2. Top Newspapers
        // Join publications -> issues -> issue_stats
        $topNewspapers = Publication::select('publications.title_ru', 'publications.title_kz')
            ->join('issues', 'publications.id', '=', 'issues.publication_id')
            ->join('issue_stats', 'issues.id', '=', 'issue_stats.issue_id')
            ->selectRaw('SUM(issue_stats.views_count) as total_views')
            ->groupBy('publications.id', 'publications.title_ru', 'publications.title_kz')
            ->orderByDesc('total_views')
            ->limit(6)
            ->get()
            ->map(function ($pub) use ($totalViews) {
                return [
                    'title' => $pub->title_ru, // Prefer RU for now or handle localization
                    'views' => (int) $pub->total_views,
                    'percentage' => $totalViews > 0 ? round(($pub->total_views / $totalViews) * 100) : 0
                ];
            });

        // 3. Recent Activity
        // We will combine "New Issues" and "Recently Viewed"
        
        // Get recent uploads
        $uploads = Issue::with('publication')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function ($issue) {
                return [
                    'type' => 'upload',
                    'action' => 'Загружен выпуск',
                    'document' => $issue->publication->title_ru . ' №' . $issue->issue_number,
                    'timestamp' => $issue->created_at,
                    'time_ago' => $issue->created_at->diffForHumans()
                ];
            });

        // Get recent views (using last_viewed_at)
        $views = IssueStat::whereNotNull('last_viewed_at')
            ->with(['issue.publication'])
            ->orderByDesc('last_viewed_at')
            ->limit(5)
            ->get()
            ->map(function ($stat) {
                return [
                    'type' => 'view',
                    'action' => 'Просмотр документа',
                    'document' => $stat->issue->publication->title_ru . ' №' . $stat->issue->issue_number,
                    'timestamp' => $stat->last_viewed_at,
                    'time_ago' => Carbon::parse($stat->last_viewed_at)->diffForHumans()
                ];
            });
            
        // Merge and sort
        $recentActivity = $uploads->concat($views)
            ->sortByDesc('timestamp')
            ->take(5)
            ->values();

        return response()->json([
            'stats' => [
                [
                    'title' => 'Всего документов',
                    'value' => number_format($totalDocuments),
                    // 'change' => '+12%', // Hard to calc without history table
                    'icon' => 'FileText',
                ],
                [
                    'title' => 'Казахских изданий',
                    'value' => number_format($countKz),
                    'icon' => 'FileText',
                ],
                [
                    'title' => 'Русских изданий',
                    'value' => number_format($countRu),
                    'icon' => 'FileText',
                ],
                [
                    'title' => 'Просмотров (всего)', // Changed to total since we don't track monthly history
                    'value' => number_format($totalViews),
                    'icon' => 'Eye',
                ],
                [
                    'title' => 'Загрузок (всего)',
                    'value' => number_format($totalDownloads),
                    'icon' => 'Download',
                ],
                [
                    'title' => 'Новых выпусков (месяц)',
                    'value' => number_format($newIssues),
                    'icon' => 'TrendingUp',
                ],
            ],
            'topNewspapers' => $topNewspapers,
            'recentActivity' => $recentActivity
        ]);
    }
}
