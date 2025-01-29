const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors({
    origin: ['https://uslibrary.vercel.app', 'http://localhost:5173'], 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }));
  
// Ganti dengan API Key Anda
const GOOGLE_BOOKS_API_KEY = 'AIzaSyCS32QAPaW0svLfLTfM4R5pt5f-8DaCCjw';

// Fungsi untuk memfilter buku dengan gambar
async function fetchBooks(query, maxResults = 10, startIndex = 0) {
    try {
        const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
            params: {
                q: query,
                key: GOOGLE_BOOKS_API_KEY,
                maxResults,
                startIndex,
                printType: 'books',
                fields: 'items(id,volumeInfo/title,volumeInfo/authors,volumeInfo/description,volumeInfo/publishedDate,volumeInfo/imageLinks,volumeInfo/publisher,volumeInfo/industryIdentifiers,volumeInfo/pageCount,volumeInfo/categories,volumeInfo/averageRating,volumeInfo/language,saleInfo),totalItems',
            },
        });

        const books = (response.data.items || []).filter(item => item.volumeInfo.imageLinks).map(item => ({
            kind: 'books#volume',
            id: item.id,
            volumeInfo: {
                title: item.volumeInfo.title || 'Tidak ada judul',
                authors: item.volumeInfo.authors || ['Tidak ada penulis'],
                publisher: item.volumeInfo.publisher || 'Tidak ada penerbit',
                publishedDate: item.volumeInfo.publishedDate || 'Tidak ada tanggal terbit',
                description: item.volumeInfo.description || 'Tidak ada deskripsi',
                industryIdentifiers: item.volumeInfo.industryIdentifiers || [],
                pageCount: item.volumeInfo.pageCount || 0,
                categories: item.volumeInfo.categories || ['Tidak ada kategori'],
                averageRating: item.volumeInfo.averageRating || 0,
                language: item.volumeInfo.language || 'Tidak ada bahasa',
                imageLinks: item.volumeInfo.imageLinks || {},
                previewLink: item.volumeInfo.previewLink || 'Tidak ada tautan pratinjau',
            },
            saleInfo: item.saleInfo || {},
        }));

        return {
            kind: 'books#volumes',
            totalItems: response.data.totalItems || 0,
            items: books,
        };
    } catch (error) {
        console.error('Error fetching books:', error.message);
        throw new Error('Terjadi kesalahan saat mengambil data buku.');
    }
}

// Fungsi untuk mendapatkan detail buku berdasarkan ID
async function fetchBookDetails(bookId) {
    try {
        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes/${bookId}`, {
            params: {
                key: GOOGLE_BOOKS_API_KEY,
                fields: 'id,volumeInfo(title,authors,description,publisher,publishedDate,pageCount,industryIdentifiers,categories,averageRating,language,imageLinks),saleInfo',
            },
        });

        const book = response.data;
        return {
            kind: 'books#volume',
            id: book.id,
            volumeInfo: {
                title: book.volumeInfo.title || 'Tidak ada judul',
                authors: book.volumeInfo.authors || ['Tidak ada penulis'],
                publisher: book.volumeInfo.publisher || 'Tidak ada penerbit',
                publishedDate: book.volumeInfo.publishedDate || 'Tidak ada tanggal terbit',
                description: book.volumeInfo.description || 'Tidak ada deskripsi',
                industryIdentifiers: book.volumeInfo.industryIdentifiers || [],
                pageCount: book.volumeInfo.pageCount || 0,
                categories: book.volumeInfo.categories || ['Tidak ada kategori'],
                averageRating: book.volumeInfo.averageRating || 0,
                language: book.volumeInfo.language || 'Tidak ada bahasa',
                imageLinks: book.volumeInfo.imageLinks || {},
                previewLink: book.volumeInfo.previewLink || 'Tidak ada tautan pratinjau',
            },
            saleInfo: book.saleInfo || {},
        };
    } catch (error) {
        console.error('Error fetching book details:', error.message);
        throw new Error('Terjadi kesalahan saat mengambil detail buku.');
    }
}

async function fetchBooksByCategory(category, maxResults = 10, startIndex = 0) {
    try {
        // Pastikan kategori yang diberikan valid
        if (!category) {
            throw new Error("Kategori tidak boleh kosong.");
        }

        const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
            params: {
                q: `subject:${category}`,  // Menambahkan kategori pada query
                key: GOOGLE_BOOKS_API_KEY,
                maxResults,
                startIndex,
                printType: 'books',
                fields: 'items(id,volumeInfo/title,volumeInfo/authors,volumeInfo/description,volumeInfo/publishedDate,volumeInfo/imageLinks,volumeInfo/publisher,volumeInfo/industryIdentifiers,volumeInfo/pageCount,volumeInfo/categories,volumeInfo/averageRating,volumeInfo/language,saleInfo),totalItems',
            },
        });

        const books = (response.data.items || []).filter(item => item.volumeInfo.imageLinks).map(item => ({
            kind: 'books#volume',
            id: item.id,
            volumeInfo: {
                title: item.volumeInfo.title || 'Tidak ada judul',
                authors: item.volumeInfo.authors || ['Tidak ada penulis'],
                publisher: item.volumeInfo.publisher || 'Tidak ada penerbit',
                publishedDate: item.volumeInfo.publishedDate || 'Tidak ada tanggal terbit',
                description: item.volumeInfo.description || 'Tidak ada deskripsi',
                industryIdentifiers: item.volumeInfo.industryIdentifiers || [],
                pageCount: item.volumeInfo.pageCount || 0,
                categories: item.volumeInfo.categories || ['Tidak ada kategori'],
                averageRating: item.volumeInfo.averageRating || 0,
                language: item.volumeInfo.language || 'Tidak ada bahasa',
                imageLinks: item.volumeInfo.imageLinks || {},
                previewLink: item.volumeInfo.previewLink || 'Tidak ada tautan pratinjau',
            },
            saleInfo: item.saleInfo || {},
        }));

        return {
            kind: 'books#volumes',
            totalItems: response.data.totalItems || 0,
            items: books,
        };
    } catch (error) {
        console.error('Error fetching books:', error.message);
        throw new Error('Terjadi kesalahan saat mengambil data buku berdasarkan kategori.');
    }
}


// Endpoint untuk mengambil buku dengan gambar
app.get('/books', async (req, res) => {
    const query = req.query.q;       // Kata kunci pencarian
    const category = req.query.category; // Kategori
    const maxResults = parseInt(req.query.maxResults) || 10;
    const startIndex = parseInt(req.query.startIndex) || 0;

    try {
        let result;

        if (category) {
            // Jika kategori ada, cari berdasarkan kategori saja
            result = await fetchBooksByCategory(category, maxResults, startIndex);
        } else if (query) {
            // Jika query ada, cari berdasarkan kata kunci
            result = await fetchBooks(query, maxResults, startIndex);
        } else {
            // Jika tidak ada query atau kategori, berikan response error
            return res.status(400).json({ error: "Query atau kategori harus disertakan." });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Endpoint untuk mengambil detail buku berdasarkan ID
app.get('/books/:id', async (req, res) => {
    const bookId = req.params.id;

    try {
        const bookDetails = await fetchBookDetails(bookId);
        res.json(bookDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
