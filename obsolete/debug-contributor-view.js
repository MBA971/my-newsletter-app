// Simple debugging script to check contributor view data
console.log('=== DEBUGGING CONTRIBUTOR VIEW ===');

// Simulate the data structures
const currentUser = {
  username: 'hiring',
  role: 'contributor',
  domain: 'Technology'
};

const news = [
  {
    id: 1,
    title: 'Test Article 1',
    content: 'This is a test article',
    author: 'hiring',
    domain: 'Technology',
    date: '2023-01-01'
  },
  {
    id: 2,
    title: 'Test Article 2',
    content: 'Another test article',
    author: 'other_user',
    domain: 'Business',
    date: '2023-01-02'
  },
  {
    id: 3,
    title: 'Test Article 3',
    content: 'Third test article',
    author: 'hiring',
    domain: 'Business',
    date: '2023-01-03'
  }
];

const domains = [
  { id: 1, name: 'Technology', color: '#3b82f6' },
  { id: 2, name: 'Business', color: '#22c55e' }
];

console.log('Current User:', currentUser);
console.log('News Items:', news);
console.log('Domains:', domains);

// Simulate the filtering logic
const contributorNews = currentUser.role === 'admin' 
  ? news.filter(item => item.author === currentUser.username)
  : news.filter(item => item.domain === currentUser.domain || item.author === currentUser.username);

console.log('\nFiltered Contributor News:');
contributorNews.forEach(item => {
  console.log(`- ${item.title} (ID: ${item.id})`);
  console.log(`  Author: "${item.author}" (Type: ${typeof item.author})`);
  console.log(`  Current User: "${currentUser.username}" (Type: ${typeof currentUser.username})`);
  console.log(`  Match: ${item.author === currentUser.username}`);
  console.log(`  Trimmed Match: ${item.author.toString().trim() === currentUser.username.toString().trim()}`);
  
  // Check edit/delete button conditions
  const isAdmin = currentUser.role === 'admin';
  const isAuthor = item.author && currentUser.username && 
                   item.author.toString().trim() === currentUser.username.toString().trim();
  
  console.log(`  isAdmin: ${isAdmin}`);
  console.log(`  isAuthor: ${isAuthor}`);
  console.log(`  Show Edit/Delete: ${isAdmin || isAuthor}`);
  console.log('');
});

console.log('=== END DEBUG ===');