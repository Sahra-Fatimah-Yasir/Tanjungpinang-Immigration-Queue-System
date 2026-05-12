<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Officer;
use App\Models\OfficerActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class OfficerAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'nip' => 'required|string',
            'password' => 'required|string|min:6',
        ]);

        $officer = Officer::where('nip', $request->nip)->first();

        if (!$officer || !Hash::check($request->password, $officer->password)) {
            throw ValidationException::withMessages([
                'nip' => ['NIP atau Password tidak valid.'],
            ]);
        }

        if ($officer->status === 'INACTIVE') {
            throw ValidationException::withMessages([
                'nip' => ['Akun petugas tidak aktif.'],
            ]);
        }

        // Update last login
        $officer->update([
            'last_login' => now(),
        ]);

        // Log activity
        OfficerActivity::create([
            'officer_id' => $officer->id,
            'action' => 'LOGIN',
            'timestamp' => now(),
        ]);

        // Create token
        $abilities = $officer->role === 'CS'
            ? ['officer', 'queue:create']
            : ['officer', 'queue:manage'];

        $token = $officer->createToken('officer-api-token', $abilities)->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'officer' => [
                    'id' => $officer->id,
                    'nip' => $officer->nip,
                    'name' => $officer->name,
                    'email' => $officer->email,
                    'phone' => $officer->phone,
                    'status' => $officer->status,
                    'role' => $officer->role, // 🔥 INI YANG PENTING
                    'counter_id' => $officer->counter_id ?? null,
                ],
                'token' => $token,
            ],
        ], 200);
    }

    public function logout(Request $request)
    {
        $officer = $request->user();

        if ($officer) {
            OfficerActivity::create([
                'officer_id' => $officer->id,
                'action' => 'LOGOUT',
                'timestamp' => now(),
            ]);

            $officer->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil',
        ], 200);
    }

    public function me(Request $request)
    {
        $officer = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'officer' => [
                    'id' => $officer->id,
                    'nip' => $officer->nip,
                    'name' => $officer->name,
                    'email' => $officer->email,
                    'phone' => $officer->phone,
                    'status' => $officer->status,
                    'role' => $officer->role, // 🔥 WAJIB JUGA DI SINI
                    'counter_id' => $officer->counter_id ?? null,
                ],
            ],
        ], 200);
    }
}
