<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Default Admin
        User::create([
            'name' => 'Администратор',
            'username' => 'admin',
            'password' => Hash::make('admin123'), // Change on production
            'role' => 'admin',
            'is_active' => true,
        ]);

        // Default Operator
        User::create([
            'name' => 'Оператор',
            'username' => 'operator',
            'password' => Hash::make('operator123'),
            'role' => 'operator',
            'is_active' => true,
        ]);
        
        // Example Publication
        \App\Models\Publication::create([
            'title_ru' => 'Звезда Прииртышья',
            'title_kz' => 'Ертіс жұлдызы',
            'slug' => 'zvezda',
        ]);
    }
}
