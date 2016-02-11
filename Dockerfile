FROM nginx
COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["/usr/sbin/nginx", "-D", "FOREGROUND"]
