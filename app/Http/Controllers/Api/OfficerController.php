<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Officer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class OfficerController extends Controller
{
    /**
     * Get all officers
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $officers = Officer::with('counter')
            ->get()
            ->map(function ($officer) {
                return [
                    'id' => $officer->id,
                    'nip' => $officer->nip,
                    'name' => $officer->name,
                    'email' => $officer->email,
                    'phone' => $officer->phone,
                    'status' => $officer->status,
                    'role' => $officer->role,
                    'counter' => $officer->counter ? [
                        'id' => $officer->counter->id,
                        'code' => $officer->counter->full_code,
                    ] : null,
                    'is_logged_in' => $officer->isLoggedIn(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $officers,
        ], 200);
    }

    public function show(int $officerId)
    {
        $officer = Officer::with('counter')->findOrFail($officerId);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $officer->id,
                'nip' => $officer->nip,
                'name' => $officer->name,
                'email' => $officer->email,
                'phone' => $officer->phone,
                'status' => $officer->status,
                'role' => $officer->role,
                'counter' => $officer->counter ? [
                    'id' => $officer->counter->id,
                    'code' => $officer->counter->full_code,
                ] : null,
                'is_logged_in' => $officer->isLoggedIn(),
            ],
        ], 200);
    }

    /**
     * Create new officer
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'nip' => 'required|string|size:18|unique:officers',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:officers',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6|confirmed',
            'counter_id' => 'nullable|exists:counters,id',
            'role' => 'nullable|in:OFFICER,CS',
        ]);

        $officer = Officer::create([
            'nip' => $request->nip,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'counter_id' => $request->counter_id,
            'status' => 'ACTIVE',
            'role' => $request->role ?? 'OFFICER',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Petugas berhasil ditambahkan',
            'data' => [
                'officer' => [
                    'id' => $officer->id,
                    'nip' => $officer->nip,
                    'name' => $officer->name,
                    'email' => $officer->email,
                    'role' => $officer->role,
                ],
            ],
        ], 201);
    }

    /**
     * Update officer info
     * 
     * @param Request $request
     * @param int $officerId
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, int $officerId)
    {
        $officer = Officer::findOrFail($officerId);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:officers,email,' . $officerId,
            'phone' => 'sometimes|string|max:20',
            'counter_id' => 'sometimes|nullable|exists:counters,id',
            'status' => 'sometimes|in:ACTIVE,INACTIVE,ON_BREAK',
            'role' => 'sometimes|in:OFFICER,CS',
        ]);

        $officer->update($request->only(['name', 'email', 'phone', 'counter_id', 'status', 'role']));

        return response()->json([
            'success' => true,
            'message' => 'Petugas berhasil diperbarui',
            'data' => $officer,
        ], 200);
    }

    /**
     * Reset officer password (admin only)
     * 
     * @param Request $request
     * @param int $officerId
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetPassword(Request $request, int $officerId)
    {
        $request->validate([
            'password' => 'required|string|min:6',
        ]);

        $officer = Officer::findOrFail($officerId);
        $officer->update(['password' => Hash::make($request->password)]);

        return response()->json([
            'success' => true,
            'message' => 'Password petugas berhasil direset',
        ], 200);
    }

    /**
     * Delete officer
     * 
     * @param int $officerId
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(int $officerId)
    {
        $officer = Officer::findOrFail($officerId);
        $officer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Petugas berhasil dihapus',
        ], 200);
    }
}
