<?php

namespace Tests\Feature;

use App\Mail\OfficerAccountCreatedMail;
use App\Models\Admin;
use App\Models\Officer;
use App\Notifications\OfficerAccountCreated;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OfficerAccountEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_officer_account_email_renders_embedded_logo(): void
    {
        $mail = (new OfficerAccountCreated(
            '198001012000010001',
            'secret123',
            'OFFICER',
        ))->toMail((object) [
            'name' => 'Petugas Test',
        ]);

        $html = $mail->render();

        $this->assertInstanceOf(OfficerAccountCreatedMail::class, $mail);
        $this->assertStringContainsString('Logo Imigrasi', $html);
        $this->assertMatchesRegularExpression('/<img src="(?:cid:|data:image)/', $html);
    }

    public function test_admin_can_create_cs_and_send_login_credentials_email(): void
    {
        Notification::fake();
        config(['mail.default' => 'smtp']);

        $admin = Admin::create([
            'name' => 'Admin Email CS',
            'email' => 'admin-email-cs@example.test',
            'password' => Hash::make('password123'),
            'role' => 'SUPER_ADMIN',
        ]);

        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/officers', [
            'nip' => '198001012000010001',
            'name' => 'Petugas CS',
            'email' => 'cs@example.test',
            'phone' => null,
            'password' => 'Rahasia123!',
            'password_confirmation' => 'Rahasia123!',
            'role' => 'CS',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email_sent', true)
            ->assertJsonPath('data.officer.role', 'CS');

        $officer = Officer::where('email', 'cs@example.test')->firstOrFail();

        Notification::assertSentTo($officer, OfficerAccountCreated::class, function (OfficerAccountCreated $notification) use ($officer) {
            $mail = $notification->toMail($officer);

            return $mail->roleLabel === 'Customer Service'
                && $mail->nip === '198001012000010001'
                && $mail->temporaryPassword === 'Rahasia123!'
                && $mail->hasTo('cs@example.test');
        });
    }

    public function test_admin_reset_cs_password_sends_new_credentials_email(): void
    {
        Notification::fake();
        config(['mail.default' => 'smtp']);

        $admin = Admin::create([
            'name' => 'Admin Reset CS',
            'email' => 'admin-reset-cs@example.test',
            'password' => Hash::make('password123'),
            'role' => 'SUPER_ADMIN',
        ]);

        $officer = Officer::create([
            'nip' => '198001012000010002',
            'name' => 'CS Reset',
            'email' => 'cs-reset@example.test',
            'password' => Hash::make('password123'),
            'status' => 'ACTIVE',
            'role' => 'CS',
        ]);

        Sanctum::actingAs($admin);

        $this->postJson("/api/admin/officers/{$officer->id}/reset-password", [
            'password' => 'PasswordBaru123!',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email_sent', true);

        Notification::assertSentTo($officer, OfficerAccountCreated::class, function (OfficerAccountCreated $notification) use ($officer) {
            $mail = $notification->toMail($officer);

            return $mail->roleLabel === 'Customer Service'
                && $mail->nip === '198001012000010002'
                && $mail->temporaryPassword === 'PasswordBaru123!'
                && $mail->hasTo('cs-reset@example.test');
        });
    }
}
