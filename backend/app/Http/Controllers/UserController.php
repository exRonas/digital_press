<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Get all users (admin/operator only)
     */
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('search') && $request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        return response()->json($users->map(function($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'last_active_at' => $user->last_active_at,
                'created_at' => $user->created_at,
            ];
        }));
    }

    /**
     * Create new user
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username', // Fix: accept username instead of email as unique identifier
            // 'email' => 'required|email|unique:users,email', // Removing email requirement if username is used
            'password' => 'required|string|min:6',
            'role' => ['required', Rule::in(['admin', 'operator'])],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'], // Using username
            'email' => $validated['username'] . '@local', // Fake email just to satisfy table constraint if necessary, or remove email column
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'created_at' => $user->created_at,
        ], 201);
    }

    /**
     * Get single user
     */
    public function show(User $user)
    {
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'last_active_at' => $user->last_active_at,
            'created_at' => $user->created_at,
        ]);
    }

    /**
     * Update user
     */
    public function update(Request $request, User $user)
    {
        // Prevent admin from demoting themselves
        if ($user->id === $request->user()->id && $request->has('role') && $request->role !== 'admin') {
            return response()->json(['message' => 'Вы не можете изменить свою роль'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'sometimes|string|min:6',
            'role' => ['sometimes', Rule::in(['admin', 'operator'])],
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ]);
    }

    /**
     * Delete user
     */
    public function destroy(Request $request, User $user)
    {
        // Prevent admin from deleting themselves
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Вы не можете удалить свой аккаунт'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'Пользователь удален']);
    }
}
