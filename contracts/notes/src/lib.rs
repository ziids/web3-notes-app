#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, String, Symbol, Vec};

// Struktur data yang akan menyimpan notes
#[contracttype]
#[derive(Clone, Debug)]
pub struct Note {
    id: u64,
    title: String,
    content: String,
}

// Storage key untuk data notes
const NOTE_DATA: Symbol = symbol_short!("NOTE_DATA");

#[contract]
pub struct NotesContract;

#[contractimpl]
impl NotesContract {
    pub fn get_notes(env: Env) -> Vec<Note> {
        // 1. ambil data notes dari storage
        return env.storage().instance().get(&NOTE_DATA).unwrap_or(Vec::new(&env));
    }

    // Fungsi untuk mengubah note berdasarkan id
    pub fn update_note(env: Env, id: u64, title: String, content: String) -> String {
        // 1. Ambil data notes dari storage
        let mut notes: Vec<Note> = env
            .storage()
            .instance()
            .get(&NOTE_DATA)
            .unwrap_or(Vec::new(&env));

        // 2. Pastikan title tidak digunakan oleh note lain
        for i in 0..notes.len() {
            let note = notes.get(i).unwrap();

            if note.title == title && note.id != id {
                return String::from_str(&env, "Notes title tidak boleh sama");
            }
        }

        // 3. Cari note berdasarkan id lalu update
        for i in 0..notes.len() {
            let mut note = notes.get(i).unwrap();

            if note.id == id {
                note.title = title;
                note.content = content;

                notes.set(i, note);

                env.storage().instance().set(&NOTE_DATA, &notes);

                return String::from_str(&env, "Notes berhasil diupdate");
            }
        }

        // 4. Jika id tidak ditemukan
        String::from_str(&env, "Notes tidak ditemukan")
    }

    // Fungsi untuk membuat note baru
    pub fn create_note(env: Env, title: String, content: String) -> String {
        // 1. Ambil data notes dari storage
        let mut notes: Vec<Note> = env
            .storage()
            .instance()
            .get(&NOTE_DATA)
            .unwrap_or(Vec::new(&env));

        // 2. Cek apakah title sudah ada
        for i in 0..notes.len() {
            if notes.get(i).unwrap().title == title {
                return String::from_str(&env, "Notes title tidak boleh sama");
            }
        }

        // 3. Buat object note baru
        let note = Note {
            id: env.prng().gen::<u64>(),
            title,
            content,
        };

        // 4. Tambahkan note baru
        notes.push_back(note);

        // 5. Simpan ke storage
        env.storage().instance().set(&NOTE_DATA, &notes);

        // 6. Berhasil
        String::from_str(&env, "Notes berhasil ditambahkan")
    }

    // Fungsi untuk menghapus notes berdasarkan id
    pub fn delete_note(env: Env, id: u64) -> String {
        // 1. ambil data notes dari storage 
        let mut notes: Vec<Note> = env.storage().instance().get(&NOTE_DATA).unwrap_or(Vec::new(&env));

        // 2. cari index note yang akan dihapus menggunakan perulangan
        for i in 0..notes.len() {
            if notes.get(i).unwrap().id == id {
                notes.remove(i);

                env.storage().instance().set(&NOTE_DATA, &notes);
                return String::from_str(&env, "Berhasil hapus notes");
            }
        }

        // 3. ketika notes tidak ditemukan
        return String::from_str(&env, "Notes tidak ditemukan");
    }
}

mod test;