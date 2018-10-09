package sqlstore

import (
	"database/sql"

	"github.com/driv3r/fathom/pkg/models"
)

// GetUser retrieves user from datastore by its ID
func (db *sqlstore) GetUser(ID int64) (*models.User, error) {
	u := &models.User{}
	query := db.Rebind("SELECT * FROM users WHERE id = ? LIMIT 1")
	err := db.Get(u, query, ID)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNoResults
		}

		return nil, err
	}

	return u, err
}

// GetUserByEmail retrieves user from datastore by its email
func (db *sqlstore) GetUserByEmail(email string) (*models.User, error) {
	u := &models.User{}
	query := db.Rebind("SELECT * FROM users WHERE email = ? LIMIT 1")
	err := db.Get(u, query, email)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNoResults
		}

		return nil, err
	}

	return u, err
}

// SaveUser inserts the user model in the connected database
func (db *sqlstore) SaveUser(u *models.User) error {
	var query = db.Rebind("INSERT INTO users(email, password) VALUES(?, ?)")
	result, err := db.Exec(query, u.Email, u.Password)
	if err != nil {
		return err
	}

	u.ID, _ = result.LastInsertId()
	return nil
}

// DeleteUser deletes the user in the datastore
func (db *sqlstore) DeleteUser(user *models.User) error {
	query := db.Rebind("DELETE FROM users WHERE id = ?")
	_, err := db.Exec(query, user.ID)
	return err
}

// CountUsers returns the number of users
func (db *sqlstore) CountUsers() (int64, error) {
	var c int64
	var sql = `SELECT COUNT(*) FROM users`
	query := db.Rebind(sql)
	err := db.Get(&c, query)
	return c, err
}
