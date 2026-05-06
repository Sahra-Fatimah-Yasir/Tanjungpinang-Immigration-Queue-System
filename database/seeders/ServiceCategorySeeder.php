<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ServiceCategory;

class ServiceCategorySeeder extends Seeder
{
    public function run(): void
    {
        ServiceCategory::updateOrCreate(
            ['code' => 'A'],
            [
                'name' => 'Ramah HAM',
                'description' => 'Layanan prioritas untuk kelompok rentan, lansia, ibu hamil, balita, dan disabilitas.',
                'is_priority' => true,
                'max_counters' => 1,
            ]
        );

        ServiceCategory::updateOrCreate(
            ['code' => 'B'],
            [
                'name' => 'M-Paspor',
                'description' => 'Permohonan paspor bagi pemohon yang sudah mendaftar melalui aplikasi M-PASPOR.',
                'is_priority' => false,
                'max_counters' => 4,
            ]
        );

        ServiceCategory::updateOrCreate(
            ['code' => 'C'],
            [
                'name' => 'Sudah Daftar',
                'description' => 'Pemohon paspor yang sudah memiliki bukti pendaftaran atau jadwal layanan.',
                'is_priority' => false,
                'max_counters' => 4,
            ]
        );

        ServiceCategory::updateOrCreate(
            ['code' => 'D'],
            [
                'name' => 'WNA / Izin Tinggal',
                'description' => 'Layanan izin tinggal dan status keimigrasian bagi warga negara asing.',
                'is_priority' => false,
                'max_counters' => 2,
            ]
        );
    }
}