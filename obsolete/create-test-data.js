import pool from './utils/database.js';

const createTestData = async () => {
  try {
    console.log('Creating test data...');
    
    // Insert test articles for each domain
    const testArticles = [
      // Hiring domain articles (domain_id: 16)
      {
        title: 'New Career Opportunities Available',
        content: 'We are excited to announce several new career opportunities within our organization. These positions offer excellent growth potential and competitive benefits.',
        domain: 16,
        author_id: 25, // hiring_manager
        pending_validation: true
      },
      {
        title: 'Employee Onboarding Process Update',
        content: 'Our onboarding process has been streamlined to provide a better experience for new hires. The updated process includes enhanced training modules and mentorship programs.',
        domain: 16,
        author_id: 25,
        pending_validation: true
      },
      
      // Communication domain articles (domain_id: 19)
      {
        title: 'Company Newsletter Launch',
        content: 'Introducing our monthly company newsletter featuring important updates, employee spotlights, and upcoming events. Stay connected with the latest news!',
        domain: 19,
        author_id: 28, // communication_manager
        pending_validation: true
      },
      {
        title: 'Internal Communication Guidelines',
        content: 'New guidelines for internal communications have been established to ensure clarity and consistency across all departments. Please review these important updates.',
        domain: 19,
        author_id: 28,
        pending_validation: true
      },
      
      // Admin domain articles (domain_id: 20)
      {
        title: 'System Maintenance Schedule',
        content: 'Scheduled maintenance will occur this weekend to improve system performance and security. Please save your work before the maintenance window begins.',
        domain: 20,
        author_id: 29, // admin_contributor
        pending_validation: true
      },
      
      // Journey domain articles (domain_id: 18)
      {
        title: 'Professional Development Workshop',
        content: 'Join us for a professional development workshop covering leadership skills and career advancement strategies. Registration is now open for all employees.',
        domain: 18,
        author_id: 27, // journey_specialist
        pending_validation: true
      },
      
      // Event domain articles (domain_id: 17)
      {
        title: 'Annual Company Picnic',
        content: 'Mark your calendars for our annual company picnic! This year\'s event will feature games, food trucks, and live music. Family members are welcome to attend.',
        domain: 17,
        author_id: 26, // event_coordinators
        pending_validation: true
      },
      {
        title: 'Team Building Activities',
        content: 'New team building activities have been planned to foster collaboration and strengthen relationships among colleagues. Sign up for sessions that interest you.',
        domain: 17,
        author_id: 26,
        pending_validation: true
      }
    ];
    
    // Insert articles
    for (const article of testArticles) {
      await pool.query(
        `INSERT INTO news (title, domain, content, author_id, pending_validation, date) 
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [article.title, article.domain, article.content, article.author_id, article.pending_validation]
      );
      console.log(`Inserted article: "${article.title}"`);
    }
    
    console.log('Test data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
};

createTestData();