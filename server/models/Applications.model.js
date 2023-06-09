const mongoose = require('mongoose');

const { Schema } = mongoose;

/*
 * Need to export this activitySchema as well? or activities can be added as object?
 * https://stackoverflow.com/questions/70481291/adding-element-inside-nested-array-in-mongoose
 */

const activitySchema = new Schema({
  activity: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
  },
});

const applicationSchema = new Schema({
  company: {
    type: String,
    required: true,
    trim: true,
  },
  position: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  dateSubmitted: {
    type: Date,
  },
  status: {
    type: String,
    trim: true,
    required: true,
  },
  nextDue: {
    type: Date,
  },
  history: {
    type: [activitySchema],
  },
  notes: {
    type: String,
  },
  link: {
    type: String,
  },
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
