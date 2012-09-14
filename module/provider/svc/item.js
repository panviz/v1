/**
 */
Class.create("Commit", Item, {

  //belongs_to Contact
  user : null,

  //has_many Messages
  message : "",

  //has_many Files
  file : [],

  //belongs_to Date
  created_at : new Date()
})
