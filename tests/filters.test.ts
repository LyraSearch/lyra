import t from "tap";
import { create, insert, search, remove } from "../src/index.js";

async function createSimpleDB() {
  const db = await create({
    schema: {
      id: 'string',
      name: 'string',
      rating: 'number',
      price: 'number',
      meta: {
        sales: 'number',
      }
    }
  });

  await insert(db, {
    id: '__1',
    name: 'washing machine',
    rating: 5,
    price: 900,
    meta: {
      sales: 100,
    }
  });

  await insert(db, {
    id: '__2',
    name: 'coffee maker',
    rating: 3,
    price: 30,
    meta: {
      sales: 25,
    }
  });

  await insert(db, {
    id: '__3',
    name: 'coffee maker deluxe',
    rating: 5,
    price: 45,
    meta: {
      sales: 25,
    }
  });

  return db;
} 

t.test("filters", t => {
  t.plan(8);

  t.test("greater than", async t => {
    t.plan(2);

    const db = await createSimpleDB();

    const r1_gt = await search(db, {
      term: 'coffee',
      where: {
        rating: {
          gt: 4,
        } 
      }
    });

    t.equal(r1_gt.count, 1);
    t.equal(r1_gt.hits[0].id, '__3');
  });

  t.test("greater than or equal to", async t => {
    t.plan(3);

    const db = await createSimpleDB();

    const r1_gte = await search(db, {
      term: 'coffee',
      where: {
        rating: {
          gte: 3,
        } 
      }
    });

    t.equal(r1_gte.count, 2);
    t.equal(r1_gte.hits[0].id, '__2');
    t.equal(r1_gte.hits[1].id, '__3');
  });

  t.test("less than", async t => {
    t.plan(2);

    const db = await createSimpleDB();

    const r1_lt = await search(db, {
      term: 'coffee',
      where: {
        rating: {
          lt: 5,
        } 
      }
    });

    t.equal(r1_lt.count, 1);
    t.equal(r1_lt.hits[0].id, '__2');
  });

  t.test("less than or equal to", async t => {
    t.plan(2);

    const db = await createSimpleDB();

    const r1_lte = await search(db, {
      term: 'coffee',
      where: {
        rating: {
          lte: 3,
        } 
      }
    });

    t.equal(r1_lte.count, 1);
    t.equal(r1_lte.hits[0].id, '__2');
  });

  t.test("equal", async t => {
    t.plan(2);

    const db = await createSimpleDB();

    const r1_lte = await search(db, {
      term: 'coffee',
      where: {
        rating: {
          eq: 3,
        } 
      }
    });

    t.equal(r1_lte.count, 1);
    t.equal(r1_lte.hits[0].id, '__2');
  });

  t.test("between", async t => {
    t.plan(2);

    const db = await createSimpleDB();

    const r1_lte = await search(db, {
      term: 'coffee',
      where: {
        rating: {
          between: [1, 4],
        } 
      }
    });

    t.equal(r1_lte.count, 1);
    t.equal(r1_lte.hits[0].id, '__2');
  });

  t.test("multiple filters", async t => {
    t.plan(2);

    const db = await createSimpleDB();

    const r1_lte = await search(db, {
      term: 'coffee',
      where: {
        rating: {
          between: [1, 4],
        },
        price: {
          lte: 40,
        }
      }
    });

    t.equal(r1_lte.count, 1);
    t.equal(r1_lte.hits[0].id, '__2');
  });

  t.test("multiple filters, and operation", async t => {
    t.plan(2);

    const db = await createSimpleDB();

    const r1_lte = await search(db, {
      term: 'coffee',
      where: {
        rating: {
          between: [1, 4],
        },
        price: {
          lte: 40,
        },
        'meta.sales': {
          eq: 25
        }
      },
    });

    t.equal(r1_lte.count, 1);
    t.equal(r1_lte.hits[0].id, '__2');
  });
});

t.test("filters after removing docs", t => {
  t.plan(2);

  t.test("remove doc with simple schema", async t => {
    t.plan(3);
  
    const db = await createSimpleDB();
  
    const r1_gt = await search(db, {
      term: 'coffee',
      where: {
        rating: {
          gt: 4,
        } 
      }
    });
  
    t.equal(r1_gt.count, 1);
    t.equal(r1_gt.hits[0].id, '__3');
  
    await remove(db, '__3');
  
    const r2_gt = await search(db, {
      term: 'coffee',
      where: {
        rating: {
          gt: 4,
        } 
      }
    });
  
    t.equal(r2_gt.count, 0);
  });

  t.test("remove doc on nested schema", async t => {
    t.plan(5);
  
    const db = await createSimpleDB();
  
    const r1_gt = await search(db, {
      term: 'coffee',
      where: {
        'meta.sales': {
          eq: 25
        }
      }
    });

    t.equal(r1_gt.count, 2);
    t.equal(r1_gt.hits[0].id, '__2');
    t.equal(r1_gt.hits[1].id, '__3');
  
    await remove(db, '__3');
  
    const r2_gt = await search(db, {
      term: 'coffee',
      where: {
        'meta.sales': {
          eq: 25
        } 
      }
    });
  
    t.equal(r2_gt.count, 1);
    t.equal(r2_gt.hits[0].id, '__2');
  });
});

t.test("should throw when using multiple operators", async t => {
  t.plan(1);

  const db = await createSimpleDB();

  try {
    await search(db, {
      term: 'coffee',
      where: {
        rating: {
          // @ts-expect-error error case
          gt: 4,
          // @ts-expect-error error case
          lte: 10
        }
      }
    });
  } catch (error) {
    t.equal(error.message, 'You can only use one operation per filter. Found 2: gt, lte');
  }
});

t.test("boolean filters", async t => {
  t.plan(7);

  const db = await create({
    schema: {
      id: 'string',
      isAvailable: 'boolean',
      name: 'string'
    }
  });

  await insert(db, {
    id: '1',
    isAvailable: true,
    name: 'coffee'
  });

  await insert(db, {
    id: '2',
    isAvailable: true,
    name: 'coffee machine'
  });

  await insert(db, {
    id: '3',
    isAvailable: false,
    name: 'coffee maker'
  });

  const r1 = await search(db, {
    term: 'coffee',
    where: {
      isAvailable: true,
    }
  });

  t.equal(r1.count, 2);
  t.equal(r1.hits[0].id, '1');
  t.equal(r1.hits[1].id, '2');

  const r2 = await search(db, {
    term: 'coffee',
    where: {
      isAvailable: false,
    }
  });

  t.equal(r2.count, 1);
  t.equal(r2.hits[0].id, '3');

  await remove(db, '2');

  const r3 = await search(db, {
    term: 'coffee',
    where: {
      isAvailable: true,
    }
  });

  t.equal(r3.count, 1);
  t.equal(r3.hits[0].id, '1');

});