
fetch('sidebar.html')
    .then(response => {
        if (!response.ok) {
            throw new Error('Kunne ikke indlæse sidebar.html');
        }
        return response.text();
    })
    .then(html => {
        document.getElementById('sidebar-container').innerHTML = html;
    })
    .catch(error => {
        console.error('Fejl ved indlæsning af sidebar:', error);
    });
