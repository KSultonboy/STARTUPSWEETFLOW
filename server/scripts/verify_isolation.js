const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

async function request(url, method, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    };

    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({})); // Handle non-JSON response

    if (!res.ok) {
        console.error(`Request ERROR: ${method} ${url}`, data);
        const error = new Error(`Request failed: ${res.status} ${res.statusText}`);
        error.response = { data, status: res.status };
        throw error;
    }
    return data;
}

async function verify() {
    console.log('--- STARTING VERIFICATION (using fetch) ---');

    console.log('1. Logging in as Platform Owner...');
    const platformRes = await request(`${BASE_URL}/platform/auth/login`, 'POST', {
        email: 'admin@sweetflow.uz',
        password: 'admin123'
    });
    const platformToken = platformRes.token;
    console.log('   Success. Token received.');

    console.log('2. Creating Tenant A (Alpha Cakes)...');
    try {
        await request(`${BASE_URL}/platform/tenants`, 'POST', { name: 'Alpha Cakes', slug: 'alpha' }, platformToken);
        console.log('   Tenant A created.');
    } catch (e) { console.log('   Tenant A creation failed (maybe exists):', e.message); }

    const tenants = await request(`${BASE_URL}/platform/tenants`, 'GET', null, platformToken);
    console.log('   Tenants List:', JSON.stringify(tenants, null, 2));

    const tenantA = tenants.find(t => t.slug === 'alpha');
    if (!tenantA) throw new Error('Tenant A not found in list');
    console.log(`   Tenant A ID: ${tenantA.id}`);

    console.log('3. Creating Tenant B (Beta Bakery)...');
    try {
        await request(`${BASE_URL}/platform/tenants`, 'POST', { name: 'Beta Bakery', slug: 'beta' }, platformToken);
        console.log('   Tenant B created.');
    } catch (e) { console.log('   Tenant B creation failed (maybe exists):', e.message); }

    // Refresh list
    const tenantsRefreshed = await request(`${BASE_URL}/platform/tenants`, 'GET', null, platformToken);
    const tenantB = tenantsRefreshed.find(t => t.slug === 'beta');
    if (!tenantB) throw new Error('Tenant B not found in list');
    console.log(`   Tenant B ID: ${tenantB.id}`);

    console.log('4. Creating Admin for Tenant A...');
    try {
        await request(`${BASE_URL}/platform/tenants/${tenantA.id}/admin`, 'POST', {
            fullName: 'Alpha Admin',
            username: 'admin_alpha',
            password: 'password123'
        }, platformToken);
        console.log('   Admin A created.');
    } catch (e) { console.log('   Admin A creation failed:', e.message); }

    console.log('5. Creating Admin for Tenant B...');
    try {
        await request(`${BASE_URL}/platform/tenants/${tenantB.id}/admin`, 'POST', {
            fullName: 'Beta Admin',
            username: 'admin_beta',
            password: 'password123'
        }, platformToken);
        console.log('   Admin B created.');
    } catch (e) { console.log('   Admin B creation failed:', e.message); }

    console.log('6. Logging in as Tenant A Admin...');
    const loginA = await request(`${BASE_URL}/auth/login`, 'POST', {
        username: 'admin_alpha',
        password: 'password123',
        tenantSlug: 'alpha'
    });
    const tokenA = loginA.accessToken;
    console.log('   Token A received.');

    console.log('7. Logging in as Tenant B Admin...');
    const loginB = await request(`${BASE_URL}/auth/login`, 'POST', {
        username: 'admin_beta',
        password: 'password123',
        tenantSlug: 'beta'
    });
    const tokenB = loginB.accessToken;
    console.log('   Token B received.');

    console.log('8. Creating "Alpha Special Cake" in Tenant A...');
    const productA = await request(`${BASE_URL}/products`, 'POST', {
        name: 'Alpha Special Cake',
        unit: 'piece',
        price: 100
    }, tokenA);
    console.log('   Product A created:', productA.id);

    console.log('9. Checking Tenant B products...');
    const productsB = await request(`${BASE_URL}/products`, 'GET', null, tokenB);
    const found = productsB.find(p => p.name === 'Alpha Special Cake');

    if (found) {
        console.error('❌ FAILURE: Tenant B sees Tenant A data!');
        process.exit(1);
    } else {
        console.log('✅ PASS: Tenant B does not see Tenant A data.');
    }

    console.log('10. Checking Tenant A products...');
    const productsA = await request(`${BASE_URL}/products`, 'GET', null, tokenA);
    const foundA = productsA.find(p => p.name === 'Alpha Special Cake');

    if (foundA) {
        console.log('✅ PASS: Tenant A sees its own data.');
    } else {
        console.error('❌ FAILURE: Tenant A cannot see its own data!');
        process.exit(1);
    }

    console.log('--- VERIFICATION SUCCESSFUL ---');
}

verify().catch(e => {
    console.error('Verification Failed:', e.message);
    if (e.response) {
        console.error('Response Data:', e.response.data);
    }
});
