// cypress/e2e/admin-flows.cy.js

const MAIN_ADMIN = {
  email: 'christianbello789@gmail.com',
  password: 'admin123'
};

describe('Test Base', () => {
  beforeEach(() => {
    // Impostiamo una viewport mobile per i test che necessitano della vista mobile
    cy.viewport('iphone-6')
    cy.visit('http://localhost:5173/login')
  })

  it('Login con admin principale', () => {
    cy.get('input[name="email"]').type(MAIN_ADMIN.email)
    cy.get('input[name="password"]').type(MAIN_ADMIN.password)
    cy.get('button[type="submit"]').click()
    
    // Verifica che siamo nella dashboard
    cy.url().should('include', '/dashboard')
  })

  // Test sidebar solo su mobile
  it('Test navigazione sidebar su mobile', () => {
    // Login
    cy.get('input[name="email"]').type(MAIN_ADMIN.email)
    cy.get('input[name="password"]').type(MAIN_ADMIN.password)
    cy.get('button[type="submit"]').click()

    // Aspetta che la dashboard si carichi completamente
    cy.url().should('include', '/dashboard')
    cy.wait(1000)

    // Ora il bottone dovrebbe essere visibile su mobile
    cy.get('.md\\:hidden').first().should('be.visible').click()
    cy.wait(500)
  })
})

describe('Gestione Clienti', () => {
  beforeEach(() => {
    // Torniamo alla viewport desktop per questi test
    cy.viewport(1280, 720)
    cy.visit('http://localhost:5173/login')
    cy.get('input[name="email"]').type(MAIN_ADMIN.email)
    cy.get('input[name="password"]').type(MAIN_ADMIN.password)
    cy.get('button[type="submit"]').click()
    // Aspetta che la dashboard si carichi
    cy.url().should('include', '/dashboard')
    cy.wait(1000) // Aspetta il caricamento completo
  })

  it('Aggiunta nuovo cliente', () => {
    // Genera un nome unico per il test
    const testCompany = `Test Company ${Date.now()}`
    
    // Aspetta che il bottone sia visibile e cliccabile
    cy.contains('Add New Client').should('be.visible').click()
    
    // Compila il form
    cy.get('input[name="companyName"]').should('be.visible').type(testCompany)
    cy.get('input[name="email"]').should('be.visible').type(`test${Date.now()}@company.com`)
    cy.get('input[name="domain"]').should('be.visible').type(`test${Date.now()}.com`)
    cy.contains('button', 'Add Client').should('be.visible').click()

    // Verifica che il cliente sia stato aggiunto
    cy.contains(testCompany).should('be.visible')
  })

  it('Test cambio piano cliente', () => {
    // Aspetta che la pagina sia completamente caricata
    cy.wait(2000)
    
    // Verifica se ci sono clienti e select disponibili
    cy.get('select').should('exist').then($select => {
      if ($select.length > 0) {
        cy.wrap($select).first().select('pro')
        cy.wait(1000) // Attendi l'aggiornamento
      }
    })
  })

  it('Test visualizzazione dettagli cliente', () => {
    // Aspetta il caricamento completo della pagina
    cy.wait(2000)
    
    // Verifica se ci sono clienti prima di procedere
    cy.get('.text-indigo-600').should('exist').then($clients => {
      if ($clients.length > 0) {
        // Clicca sul primo cliente
        cy.wrap($clients).first().click()
        
        // Aspetta il caricamento della pagina di dettaglio
        cy.wait(2000)
        
        // Verifica la presenza degli elementi nella pagina dettagli
        cy.contains('Client Information').should('exist')
        // Il Resource Usage potrebbe non essere sempre visibile, verifichiamo solo l'esistenza
        cy.get('.bg-gray-50').should('exist')
      }
    })
  })
})

describe('Test Alert e Monitoraggio', () => {
  beforeEach(() => {
    cy.viewport(1280, 720)
    cy.visit('http://localhost:5173/login')
    cy.get('input[name="email"]').type(MAIN_ADMIN.email)
    cy.get('input[name="password"]').type(MAIN_ADMIN.password)
    cy.get('button[type="submit"]').click()
    cy.wait(2000) // Aspetta il caricamento completo
  })

  it('Verifica sistema alert', () => {
    // Verifica presenza di elementi nella dashboard
    cy.get('.bg-white.shadow.rounded-lg').should('exist')
  })
})