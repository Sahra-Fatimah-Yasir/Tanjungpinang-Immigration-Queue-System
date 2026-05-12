<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Counter;
use App\Models\Officer;
use App\Models\ServiceCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Service Categories
        $services = [
            [
                'code' => 'A',
                'name' => 'Ramah HAM',
                'description' => 'Layanan prioritas untuk kelompok rentan, lansia, ibu hamil, balita, dan disabilitas.',
                'is_priority' => true,
                'max_counters' => 1,
            ],
            [
                'code' => 'B',
                'name' => 'M-Paspor',
                'description' => 'Permohonan paspor bagi pemohon yang sudah mendaftar melalui aplikasi M-PASPOR.',
                'is_priority' => false,
                'max_counters' => 4,
            ],
            [
                'code' => 'C',
                'name' => 'M-Paspor',
                'description' => 'Jalur tambahan layanan M-Paspor bagi pemohon yang sudah memiliki bukti pendaftaran atau jadwal layanan.',
                'is_priority' => false,
                'max_counters' => 4,
            ],
            [
                'code' => 'D',
                'name' => 'WNA / Izin Tinggal',
                'description' => 'Layanan izin tinggal dan status keimigrasian bagi warga negara asing.',
                'is_priority' => false,
                'max_counters' => 2,
            ],
        ];

        $createdServices = [];
        foreach ($services as $service) {
            $createdServices[$service['code']] = ServiceCategory::updateOrCreate(
                ['code' => $service['code']],
                $service
            );
        }

        // Create Counters
        $countersConfig = [
            'A' => 1,
            'B' => 4,
            'C' => 4,
            'D' => 2,
        ];

        $createdCounters = [];
        foreach ($countersConfig as $code => $count) {
            for ($i = 1; $i <= $count; $i++) {
                $counter = Counter::updateOrCreate(
                    [
                        'service_category_id' => $createdServices[$code]->id,
                        'counter_number' => $i,
                    ],
                    [
                        'code' => $code,
                        'status' => 'ACTIVE',
                    ]
                );
                $createdCounters[] = $counter;
            }
        }

        // Create Admin Users
        Admin::updateOrCreate(
            ['email' => 'admin@imigrasi.com'],
            [
                'name' => 'Admin Utama',
                'password' => Hash::make('password123'),
                'role' => 'SUPER_ADMIN',
            ]
        );

        Admin::updateOrCreate(
            ['email' => 'manager@imigrasi.com'],
            [
                'name' => 'Admin Manager',
                'password' => Hash::make('password123'),
                'role' => 'ADMIN',
            ]
        );

        // Create Officers (Petugas)
        $officers = [
            [
                'nip' => '198501151978031001',
                'name' => 'Agus Sutrisno',
                'email' => 'agus@imigrasi.com',
                'phone' => '081234567890',
                'counter_id' => $createdCounters[0]->id, // Counter A-001
                'status' => 'ACTIVE',
                'role' => 'OFFICER',
            ],
            [
                'nip' => '198602201980051002',
                'name' => 'Budi Hartoyo',
                'email' => 'budi@imigrasi.com',
                'phone' => '081234567891',
                'counter_id' => $createdCounters[1]->id, // Counter A-002
                'status' => 'ACTIVE',
                'role' => 'OFFICER',
            ],
            [
                'nip' => '198703101982061003',
                'name' => 'Citra Dewi',
                'email' => 'citra@imigrasi.com',
                'phone' => '081234567892',
                'counter_id' => $createdCounters[2]->id, // Counter A-003
                'status' => 'ACTIVE',
                'role' => 'OFFICER',
            ],
            [
                'nip' => '198804151984071004',
                'name' => 'Doni Hermawan',
                'email' => 'doni@imigrasi.com',
                'phone' => '081234567893',
                'counter_id' => $createdCounters[3]->id, // Counter A-004
                'status' => 'ACTIVE',
                'role' => 'OFFICER',
            ],
            [
                'nip' => '198905201986081005',
                'name' => 'Eka Kusuma',
                'email' => 'eka@imigrasi.com',
                'phone' => '081234567894',
                'counter_id' => $createdCounters[4]->id, // Counter B-001
                'status' => 'ACTIVE',
                'role' => 'OFFICER',
            ],
            [
                'nip' => '199006151988091006',
                'name' => 'Fitria Sari',
                'email' => 'fitria@imigrasi.com',
                'phone' => '081234567895',
                'counter_id' => $createdCounters[5]->id, // Counter B-002
                'status' => 'ACTIVE',
                'role' => 'OFFICER',
            ],
            [
                'nip' => '199107201990101007',
                'name' => 'Gita Permata',
                'email' => 'gita@imigrasi.com',
                'phone' => '081234567896',
                'counter_id' => $createdCounters[6]->id, // Counter R-001
                'status' => 'ACTIVE',
                'role' => 'OFFICER',
            ],
            [
                'nip' => '199208251992111008',
                'name' => 'Hendra Wijaya',
                'email' => 'hendra@imigrasi.com',
                'phone' => '081234567897',
                'counter_id' => $createdCounters[7]->id, // Counter C-001
                'status' => 'ACTIVE',
                'role' => 'OFFICER',
            ],
            [
                'nip' => '199309151994121009',
                'name' => 'Indah Putri',
                'email' => 'indah@imigrasi.com',
                'phone' => '081234567898',
                'counter_id' => null, // Unassigned
                'status' => 'ACTIVE',
                'role' => 'OFFICER',
            ],
            [
                'nip' => '199401011995011010',
                'name' => 'Customer Service',
                'email' => 'cs@imigrasi.com',
                'phone' => '081234567899',
                'counter_id' => null,
                'status' => 'ACTIVE',
                'role' => 'CS',
            ],
        ];

        foreach ($officers as $officer) {
            Officer::updateOrCreate(
                ['nip' => $officer['nip']],
                [
                    ...$officer,
                    'password' => Hash::make('password123'),
                ]
            );
        }

        $this->command->info('✅ Database seeded successfully!');
        $this->command->info('📊 Created:');
        $this->command->info('  • 4 Service Categories (A, B, R, C)');
        $this->command->info('  • 9 Counters');
        $this->command->info('  • 2 Admin Users');
        $this->command->info('  • 9 Officers');
        $this->command->line('');
        $this->command->info('🔐 Admin Credentials:');
        $this->command->info('  • Email: admin@imigrasi.com | Password: password123');
        $this->command->line('');
        $this->command->info('👮 Officer Login (NIP + password: password123):');
        $this->command->info('  • 198501151978031001 (Agus Sutrisno)');
        $this->command->info('  • 198602201980051002 (Budi Hartoyo)');
    }
}
