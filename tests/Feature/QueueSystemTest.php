<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Counter;
use App\Models\Officer;
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

    public function test_queue_can_be_tracked_by_ticket_number(): void
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

    public function test_queue_number_resets_each_day_and_previous_open_queue_is_closed(): void
    {
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

    public function test_public_dashboard_includes_current_and_waiting_customer_names(): void
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

        $this->getJson('/api/queue/public-dashboard')
            ->assertOk()
            ->assertJsonPath('data.active_queues.0.current_ticket.customer_name', 'Nur Aisyah')
            ->assertJsonPath('data.active_queues.0.current_ticket.counter_number', 2)
            ->assertJsonPath('data.active_queues.0.waiting_tickets.0.customer_name', 'Rina Kurnia')
            ->assertJsonPath('data.active_queues.0.waiting_tickets.0.ticket_number', 'A-002');
    }

    public function test_officer_can_call_and_complete_queue(): void
    {
        $service = ServiceCategory::create([
            'code' => 'C',
            'name' => 'Sudah Daftar',
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
