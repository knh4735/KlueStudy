import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
class Post extends BaseEntity{
  @PrimaryGeneratedColumn()
  _id: number;

  @Column({ type:"text"})
  title: string;

  @Column({ type:"text"})
  body: string;

  @Column("simple-array")
  tags: string[]; // 문자열로 이루어진 배열

  @Column()
  @CreateDateColumn()
  publishedDate: Date; // 현재 날짜를 기본 값으로 지정

  @Column("simple-json")
  user: {
    _id: number,
    username: string,
  };
}

export default Post;