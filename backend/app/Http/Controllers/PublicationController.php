<?php

namespace App\Http\Controllers;

use App\Models\Publication;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PublicationController extends Controller
{
    /**
     * Public: Get all publications (for catalog filter)
     */
    public function index()
    {
        return Publication::withCount('issues')->orderBy('title_ru')->get();
    }

    /**
     * Admin: Get all publications with stats
     */
    public function adminIndex()
    {
        return Publication::withCount('issues')
            ->orderBy('title_ru')
            ->get();
    }

    /**
     * Admin: Create new publication
     */
    public function store(Request $request)
    {
        $request->validate([
            'title_ru' => 'required|string|max:255',
            'title_kz' => 'nullable|string|max:255',
        ]);

        // Auto-generate slug from title
        $slug = Str::slug($request->title_ru);
        
        // Ensure unique slug
        $originalSlug = $slug;
        $counter = 1;
        while (Publication::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        $publication = Publication::create([
            'title_ru' => $request->title_ru,
            'title_kz' => $request->title_kz,
            'slug' => $slug,
        ]);

        return response()->json($publication->loadCount('issues'), 201);
    }

    /**
     * Admin: Get single publication
     */
    public function show(Publication $publication)
    {
        return response()->json($publication->loadCount('issues'));
    }

    /**
     * Public: Get single publication (for public page)
     */
    public function showPublic(Publication $publication)
    {
        return response()->json($publication->loadCount('issues'));
    }

    /**
     * Admin: Update publication
     */
    public function update(Request $request, Publication $publication)
    {
        $request->validate([
            'title_ru' => 'required|string|max:255',
            'title_kz' => 'nullable|string|max:255',
            'history_ru' => 'nullable|string',
            'history_kz' => 'nullable|string',
        ]);

        $publication->update([
            'title_ru' => $request->title_ru,
            'title_kz' => $request->title_kz,
            'history_ru' => $request->history_ru,
            'history_kz' => $request->history_kz,
        ]);

        return response()->json($publication->loadCount('issues'));
    }

    /**
     * Admin: Delete publication (only if no issues)
     */
    public function destroy(Publication $publication)
    {
        $issuesCount = $publication->issues()->count();
        
        if ($issuesCount > 0) {
            return response()->json([
                'message' => "Нельзя удалить издание. Сначала удалите все выпуски ({$issuesCount} шт.)",
                'issues_count' => $issuesCount,
            ], 422);
        }

        $publication->delete();

        return response()->json(['message' => 'Издание удалено']);
    }
}
