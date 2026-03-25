require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const indexes = await mongoose.connection.db
    .collection('documents')
    .listSearchIndexes()
    .toArray();

  console.log('Total search indexes:', indexes.length);

  if (indexes.length === 0) {
    console.log('NO INDEXES FOUND');
    console.log('Go to Atlas -> Atlas Search -> Create Search Index');
    process.exit(0);
  }

  indexes.forEach(i => {
    console.log('---');
    console.log('Name      :', i.name);
    console.log('Status    :', i.status);
    console.log('Type      :', i.type);
    if (i.latestDefinition) {
      console.log('Definition:', JSON.stringify(i.latestDefinition, null, 2));
    }
  });

  process.exit(0);
});