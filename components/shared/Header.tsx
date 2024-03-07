interface HeaderProps {
  title: string;
  lable?: string;
}
function Header({ title, lable }: HeaderProps) {
  return (
    <>
      <h2 className="h2-bold text-dark-600">{title}</h2>
      {lable && <p className="p-16-regular mt-4">{lable}</p>}
    </>
  );
}

export default Header;
