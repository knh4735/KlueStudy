import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, DefaultNamingStrategy } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Entity()
class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  _id: number;

  @Column({ type:"text"})
  username: string;

  @Column({ type:"text"})
  hashedPassword: string;


  setPassword(password: string) {
    const hash = bcrypt.hashSync(password, 10);
    this.hashedPassword = hash;
  };

  checkPassword(password: string): boolean {
    const result = bcrypt.compareSync(password, this.hashedPassword);
    return result; // true / false
  };

  serialize() {
    const data = {...this};
    delete data.hashedPassword;
    return data;
  };

  generateToken(): string {
    const token = jwt.sign(
      // 첫번째 파라미터엔 토큰 안에 집어넣고 싶은 데이터를 넣습니다
      {
        _id: this._id,
        username: this.username,
      },
      process.env.JWT_SECRET, // 두번째 파라미터에는 JWT 암호를 넣습니다
      {
        expiresIn: '7d', // 7일동안 유효함
      },
    );
    return token;
  };

  static async findByUsername(username: string): Promise<User> {
    return await User.findOne({where: { username }});
  };
}

export default User;