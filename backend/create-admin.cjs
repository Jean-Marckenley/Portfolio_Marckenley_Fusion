
const bcrypt = require("bcryptjs");
const { Client } = require("pg");
const readline = require("node:readline/promises");

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let client;

    try {
        const email = (await rl.question(
            "Adresse courriel administrateur : "
        )).trim().toLowerCase();

        const password = await rl.question(
            "Mot de passe administrateur : "
        );

        if (!email.includes("@") || password.length < 12) {
            throw new Error(
                "Courriel invalide ou mot de passe trop court (12 caractères minimum)."
            );
        }

        const hash = await bcrypt.hash(password, 12);

        client = new Client({
            connectionString: process.env.DATABASE_URL
        });

        await client.connect();

        const result = await client.query(
            `INSERT INTO users
         (email, password_hash, slug, is_public)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, slug`,
            [email, hash, "marckenley", true]
        );

        console.log("Compte créé :", result.rows[0]);
    } finally {
        await client?.end();
        rl.close();
    }
}

main().catch(error => {
    console.error("Erreur :", error.message);
    process.exitCode = 1;
});
