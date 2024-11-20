$(document).ready(function () {
    let currentPage = 1;
    const resultsPerPage = 10;
    const maxVisiblePages = 10; // Maximum number of visible pages at a time
    let bookshelf = JSON.parse(localStorage.getItem('bookshelf')) || [];

    // Reset Search on Home Link Click
    $('#homeLink').click(function (event) {
        event.preventDefault();
        $('#searchTerm').val(''); // Clear the search term
        $('#searchResults').empty(); // Clear the results
        $('#pagination').empty(); // Clear pagination
        $('#book-details').hide(); // Hide the book details section
    });

    // Search Button Event Listener
    $('#searchButton').click(function () {
        const searchTerm = $('#searchTerm').val().trim();

        if (!searchTerm) {
            alert('Please enter a search term.');
            return;
        }

        currentPage = 1; // Reset to the first page for a new search
        fetchBooks(searchTerm, currentPage);
    });

    // Fetch Books from Google Books API
    function fetchBooks(query, page) {
        const startIndex = (page - 1) * resultsPerPage;
        const apiURL = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=${resultsPerPage}`;

        $.getJSON(apiURL, function (data) {
            $('#searchResults').empty(); // Clear previous results

            if (data.items && data.items.length > 0) {
                data.items.forEach(function (book) {
                    const title = book.volumeInfo.title || 'No Title Available';
                    const thumbnail = book.volumeInfo.imageLinks
                        ? book.volumeInfo.imageLinks.smallThumbnail
                        : 'https://via.placeholder.com/100';

                    // Dynamically create the book entry HTML
                    const bookHTML = `
                        <div class="book-entry">
                            <img src="${thumbnail}" alt="${title}">
                            <h3><a href="#" class="book-link" data-id="${book.id}">${title}</a></h3>
                            <button class="save-to-bookshelf" data-id="${book.id}">Save to Bookshelf</button>
                        </div>`;
                    $('#searchResults').append(bookHTML);
                });

                setupPagination(data.totalItems, query);
            } else {
                $('#searchResults').html('<p>No results found.</p>');
            }
        }).fail(function () {
            console.error('API Request Failed');
            $('#searchResults').html('<p>Error fetching search results. Please try again later.</p>');
        });
    }

    // Pagination Setup
    function setupPagination(totalResults, query) {
        const totalPages = Math.ceil(totalResults / resultsPerPage);
        $('#pagination').empty();

        const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (currentPage > 1) {
            $('#pagination').append('<button class="page-btn first-page">First</button>');
            $('#pagination').append('<button class="page-btn prev-page">Previous</button>');
        }

        for (let i = startPage; i <= endPage; i++) {
            const button = `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            $('#pagination').append(button);
        }

        if (currentPage < totalPages) {
            $('#pagination').append('<button class="page-btn next-page">Next</button>');
            $('#pagination').append('<button class="page-btn last-page">Last</button>');
        }

        $('.page-btn').click(function () {
            if ($(this).hasClass('first-page')) {
                currentPage = 1;
            } else if ($(this).hasClass('prev-page')) {
                currentPage = Math.max(1, currentPage - 1);
            } else if ($(this).hasClass('next-page')) {
                currentPage = Math.min(totalPages, currentPage + 1);
            } else if ($(this).hasClass('last-page')) {
                currentPage = totalPages;
            } else {
                currentPage = $(this).data('page');
            }
            fetchBooks(query, currentPage); // Fetch new results for the selected page
        });
    }

    // Save to Bookshelf
    $(document).on('click', '.save-to-bookshelf', function () {
        const bookId = $(this).data('id');
        if (!bookshelf.includes(bookId)) {
            bookshelf.push(bookId);
            localStorage.setItem('bookshelf', JSON.stringify(bookshelf));
            alert('Book saved to bookshelf!');
        } else {
            alert('Book is already in the bookshelf!');
        }
    });

    // Show Bookshelf
    $('#bookshelfLink').click(function () {
        $('#searchResults').empty();
        $('#pagination').empty();

        if (bookshelf.length > 0) {
            bookshelf.forEach(bookId => {
                fetchBookDetails(bookId);
            });
        } else {
            $('#searchResults').html('<p>Your bookshelf is empty.</p>');
        }
    });

    // View Toggle Event Listeners
    $('#gridView').click(function () {
        $('#searchResults').removeClass('list-view').addClass('grid-view');
    });

    $('#listView').click(function () {
        $('#searchResults').removeClass('grid-view').addClass('list-view');
    });

    // Fetch Book Details
    function fetchBookDetails(bookId) {
        const apiURL = `https://www.googleapis.com/books/v1/volumes/${bookId}`;
        $.getJSON(apiURL, function (book) {
            const details = book.volumeInfo;
            const content = `
                <div class="book-entry">
                    <img src="${details.imageLinks ? details.imageLinks.smallThumbnail : 'https://via.placeholder.com/100'}" alt="${details.title}">
                    <h3>${details.title}</h3>
                    <p><strong>Author:</strong> ${details.authors ? details.authors.join(', ') : 'N/A'}</p>
                    <p><strong>Publisher:</strong> ${details.publisher || 'N/A'}, ${details.publishedDate || 'N/A'}</p>
                    <p><strong>Description:</strong> ${details.description || 'No description available.'}</p>
                    <p><a href="${details.previewLink}" target="_blank">Preview this book</a></p>
                </div>`;
            $('#searchResults').append(content);
        });
    }
});
