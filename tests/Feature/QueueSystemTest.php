<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Counter;
use App\Models\Officer;
use App\Models\OfficerActivity;
use App\Models\QueueNumber;
use App\Models\ServiceCategory;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QueueSystemTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsQueueCreator(): Officer
    {
        $officer = Officer::create([
            'nip' => '199401011995011010',
            'name' => 'Customer Service',
            'email' => 'cs@example.test',
            'password' => Hash::make('password123'),
            'status' => 'ACTIVE',
            'role' => 'CS',
        ]);

        Sanctum::actingAs($officer);

        return $officer;
    }

    public function test_public_services_can_be_loaded(): void
    {
        ServiceCategory::create([
            'code' => 'A',
            'name' => 'Ramah HAM',
            'description' => 'Layanan prioritas',
            'is_priority' => true,
            'max_counters' => 1,
        ]);

        $response = $this->getJson('/api/services');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.code', 'A');
    }

    public function test_queue_can_be_generated_with_customer_data(): void
    {
        $this->actingAsQueueCreator();

        $service = ServiceCategory::create([
            'code' => 'B',
            'name' => 'M-Paspor',
            'description' => 'Layanan paspor',
            'is_priority' => false,
            'max_counters' => 4,
        ]);

        $response = $this->postJson('/api/queue/generate', [
            'service_category_id' => $service->id,
            'customer_name' => 'Budi Santoso',
            'identity_number' => '3171000000000001',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.queue.ticket_number', 'B-001')
            ->assertJsonPath('data.queue.customer_name', 'Budi Santoso');

        $trackingCode = $response->json('data.queue.tracking_code');

        $this->assertNotEmpty($trackingCode);
        $response->assertJsonPath('data.queue.tracking_url', url("/track/{$trackingCode}"));

        $this->assertDatabaseHas('queue_numbers', [
            'ticket_number' => 'B-001',
            'customer_name' => 'Budi Santoso',
            'identity_number' => '3171000000000001',
        ]);
    }

    public function test_queue_can_be_tracked_by_tracking_code(): void
    {
        $service = ServiceCategory::create([
            'code' => 'D',
            'name' => 'WNA / Izin Tinggal',
            'description' => 'Layanan izin tinggal',
            'is_priority' => false,
            'max_counters' => 2,
        ]);

        QueueNumber::create([
            'service_category_id' => $service->id,
            'ticket_number' => 'D-001',
            'customer_name' => 'John Doe',
            'status' => 'WAITING',
            'date' => today(),
        ]);

        $trackedQueue = QueueNumber::create([
            'service_category_id' => $service->id,
            'ticket_number' => 'D-002',
            'customer_name' => 'Jane Doe',
            'status' => 'WAITING',
            'date' => today(),
        ]);

        $this->getJson("/api/queue/track/{$trackedQueue->tracking_code}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.queue.ticket_number', 'D-002')
            ->assertJsonPath('data.queue.tracking_url', url("/track/{$trackedQueue->tracking_code}"))
            ->assertJsonPath('data.progress.waiting_ahead', 1);
    }

    public function test_queue_cannot_be_tracked_by_guessable_ticket_number(): void
    {
        $service = ServiceCategory::create([
            'code' => 'H',
            'name' => 'Layanan Privasi',
            'description' => 'Layanan untuk uji tracking',
            'is_priority' => false,
            'max_counters' => 1,
        ]);

        QueueNumber::create([
            'service_category_id' => $service->id,
            'ticket_number' => 'H-001',
            'customer_name' => 'Nama Rahasia',
            'identity_number' => '3171000000000099',
            'status' => 'WAITING',
            'date' => today(),
        ]);

        $this->getJson('/api/queue/track/H-001')
            ->assertNotFound()
            ->assertJsonPath('success', false);
    }

    public function test_queue_generation_requires_cs_officer(): void
    {
        $service = ServiceCategory::create([
            'code' => 'G',
            'name' => 'Layanan Terbatas',
            'description' => 'Layanan untuk uji akses',
            'is_priority' => false,
            'max_counters' => 1,
        ]);

        $payload = [
            'service_category_id' => $service->id,
            'customer_name' => 'Budi Santoso',
        ];

        $this->postJson('/api/queue/generate', $payload)
            ->assertUnauthorized();

        $officer = Officer::create([
            'nip' => '198501151978031088',
            'name' => 'Officer Biasa',
            'email' => 'officer-limited@example.test',
            'password' => Hash::make('password123'),
            'status' => 'ACTIVE',
            'role' => 'OFFICER',
        ]);

        Sanctum::actingAs($officer);

        $this->postJson('/api/queue/generate', $payload)
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_queue_number_resets_each_day_and_previous_open_queue_is_closed(): void
    {
        $this->actingAsQueueCreator();

        $service = ServiceCategory::create([
            'code' => 'B',
            'name' => 'M-Paspor',
            'description' => 'Layanan paspor',
            'is_priority' => false,
            'max_counters' => 4,
        ]);

        $this->travelTo(CarbonImmutable::parse('2026-05-03 09:00:00', config('app.timezone')));

        $firstDayResponse = $this->postJson('/api/queue/generate', [
            'service_category_id' => $service->id,
            'customer_name' => 'Antrian Hari Pertama',
        ])->assertCreated();

        $firstTrackingCode = $firstDayResponse->json('data.queue.tracking_code');

        $this->travelTo(CarbonImmutable::parse('2026-05-04 09:00:00', config('app.timezone')));

        $secondDayResponse = $this->postJson('/api/queue/generate', [
            'service_category_id' => $service->id,
            'customer_name' => 'Antrian Hari Kedua',
        ]);

        $secondTrackingCode = $secondDayResponse->json('data.queue.tracking_code');

        $secondDayResponse
            ->assertCreated()
            ->assertJsonPath('data.queue.ticket_number', 'B-001');

        $this->assertNotSame($firstTrackingCode, $secondTrackingCode);

        $this->assertDatabaseHas('queue_numbers', [
            'tracking_code' => $firstTrackingCode,
            'status' => 'SKIPPED',
        ]);

        $this->travelBack();
    }

    public function test_public_dashboard_includes_called_customer_name_without_waiting_customer_names(): void
    {
        $service = ServiceCategory::create([
            'code' => 'A',
            'name' => 'Ramah HAM',
            'description' => 'Layanan prioritas',
            'is_priority' => true,
            'max_counters' => 1,
        ]);

        $counter = Counter::create([
            'service_category_id' => $service->id,
            'code' => $service->code,
            'counter_number' => 2,
            'status' => 'ACTIVE',
        ]);

        QueueNumber::create([
            'service_category_id' => $service->id,
            'counter_id' => $counter->id,
            'ticket_number' => 'A-001',
            'customer_name' => 'Nur Aisyah',
            'status' => 'CALLING',
            'date' => today(),
            'called_at' => now(),
        ]);

        QueueNumber::create([
            'service_category_id' => $service->id,
            'ticket_number' => 'A-002',
            'customer_name' => 'Rina Kurnia',
            'status' => 'WAITING',
            'date' => today(),
        ]);

        $response = $this->getJson('/api/queue/public-dashboard')
            ->assertOk()
            ->assertJsonPath('data.active_queues.0.current_ticket.counter_number', 2)
            ->assertJsonPath('data.active_queues.0.current_ticket.customer_name', 'Nur Aisyah')
            ->assertJsonPath('data.active_queues.0.waiting_tickets.0.ticket_number', 'A-002');

        $this->assertArrayNotHasKey(
            'customer_name',
            $response->json('data.active_queues.0.waiting_tickets.0')
        );
    }

    public function test_officer_can_call_and_complete_queue(): void
    {
        $service = ServiceCategory::create([
            'code' => 'C',
            'name' => 'M-Paspor',
            'description' => 'Layanan jadwal paspor',
            'is_priority' => false,
            'max_counters' => 4,
        ]);

        $counter = Counter::create([
            'service_category_id' => $service->id,
            'code' => $service->code,
            'counter_number' => 1,
            'status' => 'ACTIVE',
        ]);

        $officer = Officer::create([
            'nip' => '198501151978031001',
            'name' => 'Agus Sutrisno',
            'email' => 'agus@example.test',
            'password' => Hash::make('password123'),
            'counter_id' => $counter->id,
            'status' => 'ACTIVE',
            'role' => 'OFFICER',
        ]);

        $queue = QueueNumber::create([
            'service_category_id' => $service->id,
            'ticket_number' => 'C-001',
            'customer_name' => 'Siti Aminah',
            'identity_number' => '3171000000000002',
            'status' => 'WAITING',
            'date' => today(),
        ]);

        Sanctum::actingAs($officer);

        $this->postJson('/api/officer/queue/call-next', [
            'service_category_id' => $service->id,
        ])
            ->assertOk()
            ->assertJsonPath('data.queue.ticket_number', 'C-001')
            ->assertJsonPath('data.queue.customer_name', 'Siti Aminah')
            ->assertJsonPath('data.queue.counter.code', 'C-001');

        $this->postJson("/api/officer/queue/{$queue->id}/serve")
            ->assertOk()
            ->assertJsonPath('data.queue.status', 'SERVING');

        $this->postJson("/api/officer/queue/{$queue->id}/complete")
            ->assertOk()
            ->assertJsonPath('data.queue.status', 'SERVED');

        $this->assertDatabaseHas('queue_numbers', [
            'id' => $queue->id,
            'counter_id' => $counter->id,
            'status' => 'SERVED',
        ]);
    }

    public function test_queue_duration_calculations_are_never_negative(): void
    {
        $queue = new QueueNumber();
        $queue->created_at = CarbonImmutable::parse('2026-05-12 08:00:00', config('app.timezone'));
        $queue->called_at = CarbonImmutable::parse('2026-05-12 08:10:00', config('app.timezone'));
        $queue->served_at = CarbonImmutable::parse('2026-05-12 08:15:00', config('app.timezone'));
        $queue->completed_at = CarbonImmutable::parse('2026-05-12 08:30:00', config('app.timezone'));

        $this->assertSame(10, $queue->calculateWaitTime());
        $this->assertSame(15, $queue->calculateServiceTime());
        $this->assertSame(30, $queue->calculateTotalTime());

        $queue->wait_time_minutes = -10;
        $queue->service_time_minutes = -15;
        $queue->called_at = null;
        $queue->served_at = null;
        $queue->completed_at = null;

        $this->assertSame(0, $queue->resolvedWaitTimeMinutes());
        $this->assertSame(0, $queue->resolvedServiceTimeMinutes());
    }

    public function test_officer_can_call_priority_queue_from_main_counter(): void
    {
        $priorityService = ServiceCategory::create([
            'code' => 'A',
            'name' => 'Ramah HAM',
            'description' => 'Layanan prioritas',
            'is_priority' => true,
            'max_counters' => 1,
        ]);

        $mainService = ServiceCategory::create([
            'code' => 'C',
            'name' => 'M-Paspor',
            'description' => 'Layanan jadwal paspor',
            'is_priority' => false,
            'max_counters' => 4,
        ]);

        $counter = Counter::create([
            'service_category_id' => $mainService->id,
            'code' => $mainService->code,
            'counter_number' => 1,
            'status' => 'ACTIVE',
        ]);

        $officer = Officer::create([
            'nip' => '198501151978031002',
            'name' => 'Officer Prioritas',
            'email' => 'officer-priority@example.test',
            'password' => Hash::make('password123'),
            'counter_id' => $counter->id,
            'status' => 'ACTIVE',
            'role' => 'OFFICER',
        ]);

        $queue = QueueNumber::create([
            'service_category_id' => $priorityService->id,
            'ticket_number' => 'A-001',
            'customer_name' => 'Pemohon Prioritas',
            'status' => 'WAITING',
            'date' => today(),
        ]);

        Sanctum::actingAs($officer);

        $this->postJson('/api/officer/queue/call-next', [
            'service_category_id' => $priorityService->id,
        ])
            ->assertOk()
            ->assertJsonPath('data.queue.ticket_number', 'A-001')
            ->assertJsonPath('data.queue.service.code', 'A')
            ->assertJsonPath('data.queue.counter.code', 'C-001');

        $this->assertDatabaseHas('queue_numbers', [
            'id' => $queue->id,
            'counter_id' => $counter->id,
            'status' => 'CALLING',
        ]);
    }

    public function test_officer_cannot_call_non_priority_queue_from_other_service(): void
    {
        $mainService = ServiceCategory::create([
            'code' => 'B',
            'name' => 'M-Paspor',
            'description' => 'Layanan paspor',
            'is_priority' => false,
            'max_counters' => 4,
        ]);

        $otherService = ServiceCategory::create([
            'code' => 'D',
            'name' => 'WNA / Izin Tinggal',
            'description' => 'Layanan izin tinggal',
            'is_priority' => false,
            'max_counters' => 2,
        ]);

        $counter = Counter::create([
            'service_category_id' => $mainService->id,
            'code' => $mainService->code,
            'counter_number' => 1,
            'status' => 'ACTIVE',
        ]);

        $officer = Officer::create([
            'nip' => '198501151978031003',
            'name' => 'Officer Non Prioritas',
            'email' => 'officer-non-priority@example.test',
            'password' => Hash::make('password123'),
            'counter_id' => $counter->id,
            'status' => 'ACTIVE',
            'role' => 'OFFICER',
        ]);

        QueueNumber::create([
            'service_category_id' => $otherService->id,
            'ticket_number' => 'D-001',
            'status' => 'WAITING',
            'date' => today(),
        ]);

        Sanctum::actingAs($officer);

        $this->postJson('/api/officer/queue/call-next', [
            'service_category_id' => $otherService->id,
        ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_officer_dashboard_lists_priority_and_main_queue_options(): void
    {
        $priorityService = ServiceCategory::create([
            'code' => 'A',
            'name' => 'Ramah HAM',
            'description' => 'Layanan prioritas',
            'is_priority' => true,
            'max_counters' => 1,
        ]);

        $mainService = ServiceCategory::create([
            'code' => 'C',
            'name' => 'M-Paspor',
            'description' => 'Layanan jadwal paspor',
            'is_priority' => false,
            'max_counters' => 4,
        ]);

        $counter = Counter::create([
            'service_category_id' => $mainService->id,
            'code' => $mainService->code,
            'counter_number' => 1,
            'status' => 'ACTIVE',
        ]);

        $officer = Officer::create([
            'nip' => '198501151978031004',
            'name' => 'Officer Dashboard Prioritas',
            'email' => 'officer-dashboard-priority@example.test',
            'password' => Hash::make('password123'),
            'counter_id' => $counter->id,
            'status' => 'ACTIVE',
            'role' => 'OFFICER',
        ]);

        QueueNumber::create([
            'service_category_id' => $priorityService->id,
            'ticket_number' => 'A-001',
            'status' => 'WAITING',
            'date' => today(),
        ]);

        QueueNumber::create([
            'service_category_id' => $mainService->id,
            'ticket_number' => 'C-001',
            'status' => 'WAITING',
            'date' => today(),
        ]);

        Sanctum::actingAs($officer);

        $this->getJson('/api/officer/dashboard')
            ->assertOk()
            ->assertJsonPath('data.callable_services.0.code', 'A')
            ->assertJsonPath('data.callable_services.0.waiting_count', 1)
            ->assertJsonPath('data.callable_services.1.code', 'C')
            ->assertJsonPath('data.callable_services.1.waiting_count', 1)
            ->assertJsonPath('data.next_service.code', 'A')
            ->assertJsonPath('data.queue_in_waiting', 2);
    }

    public function test_officer_cannot_call_next_when_current_ticket_is_still_active(): void
    {
        $service = ServiceCategory::create([
            'code' => 'F',
            'name' => 'Layanan Uji Aktif',
            'description' => 'Layanan untuk menguji queue aktif',
            'is_priority' => false,
            'max_counters' => 2,
        ]);

        $counter = Counter::create([
            'service_category_id' => $service->id,
            'code' => $service->code,
            'counter_number' => 1,
            'status' => 'ACTIVE',
        ]);

        $officer = Officer::create([
            'nip' => '198501151978031055',
            'name' => 'Officer Aktif',
            'email' => 'officer-active@example.test',
            'password' => Hash::make('password123'),
            'counter_id' => $counter->id,
            'status' => 'ACTIVE',
            'role' => 'OFFICER',
        ]);

        QueueNumber::create([
            'service_category_id' => $service->id,
            'ticket_number' => 'F-001',
            'status' => 'WAITING',
            'date' => today(),
        ]);

        QueueNumber::create([
            'service_category_id' => $service->id,
            'ticket_number' => 'F-002',
            'status' => 'WAITING',
            'date' => today(),
        ]);

        Sanctum::actingAs($officer);

        $this->postJson('/api/officer/queue/call-next', [
            'service_category_id' => $service->id,
        ])->assertOk();

        $this->postJson('/api/officer/queue/call-next', [
            'service_category_id' => $service->id,
        ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_admin_can_create_counter_and_assign_officer(): void
    {
        $admin = Admin::create([
            'name' => 'Admin Counter',
            'email' => 'counter@example.test',
            'password' => Hash::make('password123'),
            'role' => 'SUPER_ADMIN',
        ]);

        $service = ServiceCategory::create([
            'code' => 'E',
            'name' => 'Layanan Tes',
            'description' => 'Layanan tes counter',
            'is_priority' => false,
            'max_counters' => 2,
        ]);

        $officer = Officer::create([
            'nip' => '198501151978031099',
            'name' => 'Officer Counter',
            'email' => 'officer-counter@example.test',
            'password' => Hash::make('password123'),
            'status' => 'ACTIVE',
            'role' => 'OFFICER',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/counters', [
            'service_category_id' => $service->id,
            'counter_number' => 1,
            'status' => 'ACTIVE',
            'officer_id' => $officer->id,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'E-001')
            ->assertJsonPath('data.officer.id', $officer->id);

        $counterId = $response->json('data.id');

        $this->assertDatabaseHas('counters', [
            'service_category_id' => $service->id,
            'counter_number' => 1,
            'status' => 'ACTIVE',
        ]);

        $this->assertDatabaseHas('officers', [
            'id' => $officer->id,
            'counter_id' => $counterId,
        ]);
    }

    public function test_admin_can_delete_counter_with_officer_and_served_queue_history(): void
    {
        $admin = Admin::create([
            'name' => 'Admin Delete Counter',
            'email' => 'admin-delete-counter@example.test',
            'password' => Hash::make('password123'),
            'role' => 'SUPER_ADMIN',
        ]);

        $service = ServiceCategory::create([
            'code' => 'I',
            'name' => 'Layanan Hapus Loket',
            'description' => 'Layanan untuk uji hapus loket',
            'is_priority' => false,
            'max_counters' => 1,
        ]);

        $counter = Counter::create([
            'service_category_id' => $service->id,
            'code' => $service->code,
            'counter_number' => 1,
            'status' => 'ACTIVE',
        ]);

        $officer = Officer::create([
            'nip' => '198501151978031069',
            'name' => 'Officer Loket Hapus',
            'email' => 'officer-counter-delete@example.test',
            'password' => Hash::make('password123'),
            'counter_id' => $counter->id,
            'status' => 'ACTIVE',
            'role' => 'OFFICER',
        ]);

        $queue = QueueNumber::create([
            'service_category_id' => $service->id,
            'counter_id' => $counter->id,
            'ticket_number' => 'I-001',
            'status' => 'SERVED',
            'date' => today(),
            'called_at' => now()->subMinutes(10),
            'served_at' => now()->subMinutes(8),
            'completed_at' => now()->subMinutes(3),
        ]);

        Sanctum::actingAs($admin);

        $this->deleteJson("/api/admin/counters/{$counter->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('counters', [
            'id' => $counter->id,
        ]);
        $this->assertDatabaseHas('officers', [
            'id' => $officer->id,
            'counter_id' => null,
        ]);
        $this->assertDatabaseHas('queue_numbers', [
            'id' => $queue->id,
            'counter_id' => null,
        ]);
    }

    public function test_admin_cannot_delete_counter_with_active_queue(): void
    {
        $admin = Admin::create([
            'name' => 'Admin Counter Aktif',
            'email' => 'admin-active-counter@example.test',
            'password' => Hash::make('password123'),
            'role' => 'SUPER_ADMIN',
        ]);

        $service = ServiceCategory::create([
            'code' => 'J',
            'name' => 'Layanan Aktif Loket',
            'description' => 'Layanan untuk uji loket aktif',
            'is_priority' => false,
            'max_counters' => 1,
        ]);

        $counter = Counter::create([
            'service_category_id' => $service->id,
            'code' => $service->code,
            'counter_number' => 1,
            'status' => 'ACTIVE',
        ]);

        QueueNumber::create([
            'service_category_id' => $service->id,
            'counter_id' => $counter->id,
            'ticket_number' => 'J-001',
            'status' => 'CALLING',
            'date' => today(),
            'called_at' => now(),
        ]);

        Sanctum::actingAs($admin);

        $this->deleteJson("/api/admin/counters/{$counter->id}")
            ->assertStatus(400)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('counters', [
            'id' => $counter->id,
        ]);
    }

    public function test_admin_can_update_officer_nip(): void
    {
        $admin = Admin::create([
            'name' => 'Admin Officer',
            'email' => 'admin-officer@example.test',
            'password' => Hash::make('password123'),
            'role' => 'SUPER_ADMIN',
        ]);

        $officer = Officer::create([
            'nip' => '198501151978031066',
            'name' => 'Officer Lama',
            'email' => 'officer-edit@example.test',
            'password' => Hash::make('password123'),
            'status' => 'ACTIVE',
            'role' => 'OFFICER',
        ]);

        Sanctum::actingAs($admin);

        $this->putJson("/api/admin/officers/{$officer->id}", [
            'nip' => '198501151978031067',
            'name' => 'Officer Baru',
            'email' => null,
            'phone' => null,
        ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('officers', [
            'id' => $officer->id,
            'nip' => '198501151978031067',
            'name' => 'Officer Baru',
            'email' => null,
            'phone' => null,
        ]);
    }

    public function test_admin_can_delete_officer_with_activity_history(): void
    {
        $admin = Admin::create([
            'name' => 'Admin Delete Officer',
            'email' => 'admin-delete-officer@example.test',
            'password' => Hash::make('password123'),
            'role' => 'SUPER_ADMIN',
        ]);

        $officer = Officer::create([
            'nip' => '198501151978031068',
            'name' => 'Officer Hapus',
            'email' => 'officer-delete@example.test',
            'password' => Hash::make('password123'),
            'status' => 'ACTIVE',
            'role' => 'OFFICER',
        ]);

        OfficerActivity::create([
            'officer_id' => $officer->id,
            'action' => 'LOGIN',
            'timestamp' => now(),
        ]);

        $officer->createToken('officer-api-token', ['officer']);

        Sanctum::actingAs($admin);

        $this->deleteJson("/api/admin/officers/{$officer->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('officers', [
            'id' => $officer->id,
        ]);
        $this->assertDatabaseMissing('officer_activities', [
            'officer_id' => $officer->id,
        ]);
    }

    public function test_admin_can_load_complete_queue_report(): void
    {
        $admin = Admin::create([
            'name' => 'Admin Report',
            'email' => 'admin-report@example.test',
            'password' => Hash::make('password123'),
            'role' => 'SUPER_ADMIN',
        ]);

        $service = ServiceCategory::create([
            'code' => 'K',
            'name' => 'Layanan Laporan',
            'description' => 'Layanan untuk uji laporan',
            'is_priority' => false,
            'max_counters' => 2,
        ]);

        $counter = Counter::create([
            'service_category_id' => $service->id,
            'code' => $service->code,
            'counter_number' => 1,
            'status' => 'ACTIVE',
        ]);

        $officer = Officer::create([
            'nip' => '198501151978031070',
            'name' => 'Officer Report',
            'email' => 'officer-report@example.test',
            'password' => Hash::make('password123'),
            'counter_id' => $counter->id,
            'status' => 'ACTIVE',
            'role' => 'OFFICER',
        ]);

        $reportDate = QueueNumber::operationalDate()->toDateString();

        $queue = QueueNumber::create([
            'service_category_id' => $service->id,
            'counter_id' => $counter->id,
            'ticket_number' => 'K-001',
            'customer_name' => 'Pemohon Laporan',
            'identity_number' => '3171000000000091',
            'status' => 'SERVED',
            'date' => $reportDate,
            'called_at' => now()->subMinutes(20),
            'served_at' => now()->subMinutes(15),
            'completed_at' => now()->subMinutes(5),
            'wait_time_minutes' => 10,
            'service_time_minutes' => 10,
        ]);

        OfficerActivity::create([
            'officer_id' => $officer->id,
            'queue_number_id' => $queue->id,
            'action' => 'CALL_TICKET',
            'timestamp' => now()->subMinutes(20),
        ]);

        OfficerActivity::create([
            'officer_id' => $officer->id,
            'queue_number_id' => $queue->id,
            'action' => 'COMPLETE_TICKET',
            'timestamp' => now()->subMinutes(5),
        ]);

        Sanctum::actingAs($admin);

        $this->getJson("/api/queue/report?from={$reportDate}&to={$reportDate}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.summary.total_queues', 1)
            ->assertJsonPath('data.summary.completed', 1)
            ->assertJsonPath('data.by_service.0.service_code', 'K')
            ->assertJsonPath('data.queues.0.ticket_number', 'K-001')
            ->assertJsonPath('data.queues.0.customer_name', 'Pemohon Laporan')
            ->assertJsonPath('data.queues.0.counter.code', 'K-001')
            ->assertJsonPath('data.queues.0.officers.called_by.name', 'Officer Report')
            ->assertJsonPath('data.queues.0.activities.1.action', 'COMPLETE_TICKET');
    }

    public function test_officer_token_cannot_access_admin_routes(): void
    {
        $officer = Officer::create([
            'nip' => '198501151978031077',
            'name' => 'Officer Non Admin',
            'email' => 'not-admin@example.test',
            'password' => Hash::make('password123'),
            'status' => 'ACTIVE',
            'role' => 'OFFICER',
        ]);

        Sanctum::actingAs($officer);

        $this->getJson('/api/admin/dashboard')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_admin_token_cannot_access_officer_routes(): void
    {
        $admin = Admin::create([
            'name' => 'Admin Bukan Officer',
            'email' => 'admin-not-officer@example.test',
            'password' => Hash::make('password123'),
            'role' => 'SUPER_ADMIN',
        ]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/officer/dashboard')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_admin_can_login_with_api_token(): void
    {
        Admin::create([
            'name' => 'Admin Utama',
            'email' => 'admin@example.test',
            'password' => Hash::make('password123'),
            'role' => 'SUPER_ADMIN',
        ]);

        $this->postJson('/api/admin/login', [
            'email' => 'admin@example.test',
            'password' => 'password123',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['admin', 'token']]);
    }
}
