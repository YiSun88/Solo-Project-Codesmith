const router = require('express').Router();
const async = require('async');
const authController = require('../controllers/authController');

const Application = require('../models/Applications.model');

// Get all applications for the Frontend table
router.get('/', authController.verifyJWT, async (req, res, next) => {
  try {
    const apps = await Application.find();
    const MAXDATE = 10 ** 15;
    apps.sort(
      (a, b) =>
        (b.dateSubmitted ? b.dateSubmitted : MAXDATE) -
        (a.dateSubmitted ? a.dateSubmitted : MAXDATE)
    );
    res.status(200).json(apps);
  } catch (err) {
    next({
      log: `Error encountered in application get "/" route. ${err}`,
      status: 500,
      message: {
        err: 'An error occurred when getting the applications.',
      },
    });
  }
});

// Get all statistic counts
router.get('/counts', authController.verifyJWT, async (req, res, next) => {
  try {
    /*
     * To-Do: refactor to aggregate MongoDB query(iterate through the Collection only once to get all counts) to further optimize performance.
     */

    const results = await async.parallel({
      submittedCount: async () => {
        const submittedCount = await Application.countDocuments({
          dateSubmitted: { $ne: null },
        });
        return submittedCount;
      },

      /*
      * To-Do: this query is currently counting for all applications with the status 'Interview Scheduled',
      this can be more than just the future interviews to attend
      */
      interviewCount: async () => {
        const interviewCount = await Application.countDocuments({
          status: 'Interview Scheduled',
        });
        return interviewCount;
      },

      offerCount: async () => {
        const offerCount = await Application.countDocuments({
          status: 'Offer Received',
        });
        return offerCount;
      },

      remoteCount: async () => {
        const remoteCount = await Application.countDocuments({
          location: /remote/i,
        });
        return remoteCount;
      },

      houstonCount: async () => {
        const houstonCount = await Application.countDocuments({
          location: /houston/i,
        });
        return houstonCount;
      },
    });
    res.status(200).json(results);
  } catch (err) {
    next({
      log: `Error encountered in application get "/counts" route. ${err}`,
      status: 500,
      message: {
        err: 'An error occurred when getting the counts.',
      },
    });
  }
});

// Get counts by months
router.get(
  '/counts/months',
  authController.verifyJWT,
  async (req, res, next) => {
    try {
      const countByMonth = await Application.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$dateSubmitted' },
              month: { $month: '$dateSubmitted' },
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]);
      res.status(200).json(countByMonth);
    } catch (err) {
      next({
        log: `Error encountered in application get "/counts/months" route, ${err}`,
        status: 500,
        message: {
          err: 'An error occurred when getting the applicaiton counts by months.',
        },
      });
    }
  }
);

// Add a new job application
router.post('/add', authController.verifyJWT, (req, res, next) => {
  const { company, position, location, status, dateSubmitted, history, notes } =
    req.body;

  const newApp = new Application({
    company,
    position,
    location,
    status,
    dateSubmitted,
    history,
    notes,
  });

  /*
   * .catch() will only catch the rejected promise. Need to use try/catch if the error is not rejected properly or being thrown. (i.e. using an invalid method in the promise chain like .any())
   */
  try {
    newApp
      .save()
      .then((application) => res.status(200).json(application))
      .catch((err) =>
        next({
          log: `Error encountered in application post "/add" route, when adding an app to database. ${err}`,
          status: 500,
          message: {
            err: 'An error occurred when adding the application.\n Please fill all required fields.',
          },
        })
      );
  } catch (err) {
    next({
      log: `Error encountered in application post "/add" route, maybe wrong promise chain. ${err}`,
      status: 500,
      message: {
        err: 'An error occurred when adding the application.',
      },
    });
  }
});

// Edit an existing job application
router.put('/edit/:id', authController.verifyJWT, async (req, res, next) => {
  const { id } = req.params;
  const { company, position, location, status, dateSubmitted, history, notes } =
    req.body;

  try {
    const updatedApp = await Application.findByIdAndUpdate(
      id,
      {
        company,
        position,
        location,
        status,
        dateSubmitted,
        history,
        notes,
      },
      { returnDocument: 'after' }
    );
    res.status(200).json(updatedApp);
  } catch (err) {
    next({
      log: `Error encountered in application put "/edit/:id" route, ${err}`,
      status: 500,
      message: {
        err: 'An error occurred when editing the application.',
      },
    });
  }
});

// Get an existing application
router.get('/:id', authController.verifyJWT, async (req, res, next) => {
  const { id } = req.params;

  try {
    const foundApp = await Application.findById(id);
    res.status(200).json(foundApp);
  } catch (err) {
    next({
      log: `Error encountered in application get "/:id" route, ${err}`,
      status: 500,
      message: {
        err: 'An error occurred when finding the application.',
      },
    });
  }
});

// Delete an existing job application
router.delete(
  '/delete/:id',
  authController.verifyJWT,
  authController.verifyJWT,
  async (req, res, next) => {
    const { id } = req.params;
    try {
      const deletedApp = await Application.findByIdAndDelete(id);
      if (!deletedApp) {
        return next({
          log: `Error encountered in application delete "/delete/:id" route, document with the specific id was not found in database`,
          status: 500,
          message: {
            err: 'An error occurred when deleting the application. Document with the specific id was not found in database',
          },
        });
      }
      return res.status(200).json(deletedApp._id);
    } catch (err) {
      return next({
        log: `Error encountered in application delete "/delete/:id" route, ${err}`,
        status: 500,
        message: {
          err: 'An error occurred when deleting the application.',
        },
      });
    }
  }
);

module.exports = router;
