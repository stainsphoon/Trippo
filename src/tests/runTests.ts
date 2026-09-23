import { runDestinationAutocompleteTests } from './destinationAutocomplete.test';
import { runGroupingVerificationSuite } from './destinationGroupingTest';
import { runResiliencyAndSearchTestSuite } from './resiliencyAndSearchTests';

async function main() {
  try {
    runDestinationAutocompleteTests();
    runGroupingVerificationSuite();
    await runResiliencyAndSearchTestSuite();
    console.log('\n==================================================');
    console.log('       ALL REGRESSION TESTS COMPLETED GREEN       ');
    console.log('==================================================');
  } catch (err: any) {
    console.error('\n==================================================');
    console.error('             REGRESSION TESTS FAILED              ');
    console.error('==================================================');
    console.error(err.message);
    process.exit(1);
  }
}

main();

